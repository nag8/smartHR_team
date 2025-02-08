// SmartHRからメンバー情報をもってきてシートに反映する。一番最後でチームシートの更新も行う。
function refreshCrewSheet(){
  const sheetCrewList = getCrewListFromSheet();
  const employmentTypeDic = getEmploymentTypeDic();
  const kintoneMemberList = Kintone.getMemberList();

  const outList = getCrewList().map(crew => {
    const sheetCrew = sheetCrewList.find(sc => crew.isSame(sc));
    sheetCrew ? crew.setAuthorityLevel(sheetCrew.getAuthorityLevel()) : crew.generateAuthorityLevel(employmentTypeDic);
    crew.findSetEmail(kintoneMemberList);
    return crew.getOutList();
  });

  Util.refreshSheet(SHEET.crew.name, outList, SHEET.crew.column.id, SHEET.crew.row.data);

  refreshTeamSheet();
}


// チームシートの更新も行う。
function refreshTeamSheet(){
  const crewList = getCrewListFromSheet().filter(c => c.isSameStatus(CREW.status.employed) && c.haveEmail());
  const outsourcerList = getOutsourcerList();
  const teamList = getTeamListSetCrew(crewList, outsourcerList);

  Util.setList(
    SHEET.team,
    SHEET.team.row.data,
    SHEET.team.column.memberNum,
    teamList.map(t => t.getOutList())
  );
}

// いろいろな情報を精査してアラートをslackに送信する
function alert(){
  const crewList = getCrewListFromSheet().filter(c => c.isSameStatus(CREW.status.employed) && c.haveEmail() && !c.isBeforeJoin());
  const outsourcerList = getOutsourcerList();
  const teamList = getTeamListSetCrew(crewList, outsourcerList);

  const alertList = [].concat(
    getAlertListTeam(teamList),
    getAlertListGoogleGroup(crewList, teamList),
    getAlertListCrew(crewList, teamList)
  );

  if(alertList.length){
    Util.slackChannel(
      PropertiesService.getScriptProperties().getProperty('設定したslackWebhook'),
      alertList.join('\n')
    );
  }
}

function getAlertListGoogleGroup(crewList, teamList){
  const googleGroupList = teamList.reduce((googleGroupList, team) => {
    return googleGroupList.concat(team.getGoogleGroup());
  }, []).filter(googleGroup => googleGroup !== '');

  return Array.from(new Set(googleGroupList)).reduce((alertList, googleGroup) => {
    const emailList = manageGoogleGroup.getGoogleGroupEmailList(googleGroup);

    const alertEmailList = crewList.reduce((alertEmailList, crew) => {
      const joinTeamList = teamList.filter(t => t.isCrew(crew));
      if(joinTeamList.some(t => t.isSameGoogleGroup(googleGroup))){
        if(!emailList.includes(crew.getEmail())) alertEmailList.push(`+ ${crew.getEmail()}`);
      }else{
        if(emailList.includes(crew.getEmail())) alertEmailList.push(`- ${crew.getEmail()}`);
      }
      return alertEmailList;
    }, []);

    if(alertEmailList.length) alertList.push(`${googleGroup} \n${alertEmailList.join('\n')}\n`);
    return alertList;
  }, []);
}

function getAlertListTeam(teamList){
  return teamList.reduce((alertTextList, team) => {
    if(team.isNoCrew()) alertTextList.push(`${team.getName()} のメンバーが0人\n`);
    return alertTextList;
  }, []);
}

function getAlertListCrew(crewList, teamList){

  let slackAuthorityDic = {};
  slackAuthorityDic[SlackUtil.MEMBER.status.member.owner.primary] = 5;
  slackAuthorityDic[SlackUtil.MEMBER.status.member.owner.normal] = 4;
  slackAuthorityDic[SlackUtil.MEMBER.status.member.admin] = 3;
  slackAuthorityDic[SlackUtil.MEMBER.status.member.normal] = 2;
  slackAuthorityDic[SlackUtil.MEMBER.status.guest.multi] = 1;


  const slackMemberList = SlackUtil.getMemberListFromSheet();

  return crewList.reduce((alertList, crew) => {
    const joinTeamList = teamList.filter(team => team.isCrew(crew));
    const slackMember = slackMemberList.find(slackMember => slackMember.isSameEmail(crew.getEmail()));

    if(!joinTeamList.length || slackMember === undefined) return alertList;
    const maxSlackAuthority = joinTeamList.reduce((authorityIndex, team) => {
      if(authorityIndex < slackAuthorityDic[team.getSlackAuthority()]) authorityIndex = slackAuthorityDic[team.getSlackAuthority()];
      return authorityIndex;
    }, 0);

    if(slackAuthorityDic[slackMember.getStatus()] !== maxSlackAuthority){
      alertList.push(`slack権限相違: ${crew.getName()} slack: ${slackMember.getStatus()} sheet: ${Object.keys(slackAuthorityDic).find(key => slackAuthorityDic[key] === maxSlackAuthority)}`);
    }

    return alertList;
  }, []);
}

// アラートで問題がなければこれを実行する。kintoneグループを自動更新する。
function updateKintoneGroup(){
  const crewList = getCrewListFromSheet().filter(c => c.isSameStatus(CREW.status.employed) && c.haveEmail());
  const outsourcerList = getOutsourcerList();
  const teamList = getTeamListSetCrew(crewList, outsourcerList);

  const kintoneGroupList = teamList.reduce((kintoneGroupList, team) => {
    const kintoneGroup = team.getKintoneGroup();
    if(kintoneGroup === '') return kintoneGroupList;
    const group = kintoneGroupList.find(group => group.code === kintoneGroup);
    if(group !== undefined){
      group.member = group.member.concat(team.getCrewMailList());
    }else{
      kintoneGroupList.push({
        code: kintoneGroup,
        member: team.getCrewMailList(),
      });
    }
    return kintoneGroupList;
  }, []);

  const kintoneUserCodeList = Kintone.getUserCodeList();

  kintoneGroupList.forEach(kg => {
    kg.member = Array.from(new Set(kg.member)).filter(mail => mail.length && kintoneUserCodeList.includes(mail));
    Kintone.refreshGroupUsers(kg.code, kg.member);
  });
}

// バクラクのユーザー更新用CSVを作成する。シートにCSV出漁可能な状態で更新されるので、それをDLしてバクラクに反映する。
function refreshBakurakuSheet(){
  const bakurakuCrewSheetList = getBakurakuCrewList();

  let errorMessage = {
    noIdNum: 0,
  };

  const crewList = getCrewListFromSheet().filter(crew => crew.isSameStatus(CREW.status.employed) && crew.haveEmail());

  const bakurakuCrewList = crewList.map(crew => {
    const bakurakuCrew = new BakurakuCrew();
    bakurakuCrew.setDataFromSmartHRCrew(crew);
    bakurakuCrew.findSetId(bakurakuCrewSheetList);
    if(bakurakuCrew.isNoId()) errorMessage.noIdNum++;
    return bakurakuCrew;
  });

  const outsourcerList = getOutsourcerList();
  const teamList = getTeamListSetCrew(crewList, outsourcerList);
  const bakurakuManualTeamList = getBakurakuManualTeamList();

  Util.refreshSheet(
    SHEET.bakurakuCrewOut.name,
    bakurakuCrewList.map(bc => bc.getOutList(teamList, bakurakuManualTeamList)),
    SHEET.bakurakuCrewOut.column.id,
    SHEET.bakurakuCrewOut.row.data
  );

  Browser.msgBox(`idなし: ${errorMessage.noIdNum}`);
}
