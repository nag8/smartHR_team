class Team{
  constructor(row){
    this.name = row[SHEET.team.column.name - 1];
    this.authorityLevel = row[SHEET.team.column.authorityLevel - 1];
    this.department = row[SHEET.team.column.department - 1];
    this.position = row[SHEET.team.column.position - 1];
    this.kintoneGroup = row[SHEET.team.column.kintoneGroup - 1];
    this.googleGroup = row[SHEET.team.column.googleGroup - 1];
    this.slack = {
      authority: row[SHEET.team.column.slack.authority - 1],
      usergroupId: row[SHEET.team.column.slack.usergroupId - 1],
      usergroupMemberList: undefined,
    };
    this.bakurakuAuthority = {
      user: row[SHEET.team.column.bakurakuAuthority.user - 1],
      expenses: row[SHEET.team.column.bakurakuAuthority.expenses - 1],
      expensesApprove: row[SHEET.team.column.bakurakuAuthority.expensesApprove - 1],
      invoice: row[SHEET.team.column.bakurakuAuthority.invoice - 1],
      credit: row[SHEET.team.column.bakurakuAuthority.credit - 1],
      team: row[SHEET.team.column.bakurakuAuthority.team - 1],
    };
    this.crewMailList = [];
  }

  isSameAuthorityLevel(authorityLevel){
    if(this.authorityLevel === '') return true;
    return this.authorityLevel === authorityLevel;
  }

  isMatchDepartment(department){
    return this.department === '' || department?.includes(this.department);
  }

  isMatchPosition(position){
    return this.position === '' || position?.includes(this.position);
  }

  isCrew(crew){
    return this.crewMailList.includes(crew.getEmail());
  }

  isIncludesEmail(email){
    return this.crewMailList.includes(email);
  }

  isNoCrew(){
    return this.crewMailList.length === 0;
  }

  isSameName(teamName){
    return this.name === teamName;
  }

  isSameSlackAuthority(slackAuthority){
    return slackAuthority === this.slack.authority;
  }

  isSameGoogleGroup(googleGroup){
    return this.googleGroup === googleGroup;
  }

  findSetCrewMailList(crewList){
    this.crewMailList = crewList.reduce((mailList, crew) => {
      if(crew.isSameteam(this)) mailList.push(crew.getEmail());
      return mailList;
    }, []);
  }

  findSetCrewFromOutsourcerList(outsourcerList){
    outsourcerList.forEach(outsourcer => {
      if(this.isSameName(outsourcer.teamName)) this.crewMailList.push(outsourcer.email);
    });
  }

  setCrewMailList(mailList){
    this.crewMailList = mailList;
  }

  getCrewMailList(){
    return this.crewMailList;
  }

  getName(){
    return this.name;
  }

  getSlackAuthority(){
    return this.slack.authority;
  }

  getKintoneGroup(){
    return this.kintoneGroup;
  }

  getGoogleGroup(){
    return this.googleGroup;
  }

  getUserGroupMemberIdList(){
    if(this.slack.usergroupId === '') return [];
    if(this.slack.usergroupMemberList === undefined){
      this.slack.usergroupMemberList = SlackUtil.getUserGroupMemberIdList(this.slack.usergroupId);
    }
    return this.slack.usergroupMemberList;
  }

  getBakurakuAuthorityUser(){
    return this.bakurakuAuthority.user;
  }

  getBakurakuAuthorityExpenses(){
    return this.bakurakuAuthority.expenses;
  }

  getBakurakuAuthorityExpensesApprove(){
    return this.bakurakuAuthority.expensesApprove;
  }

  getBakurakuAuthorityInvoice(){
    return this.bakurakuAuthority.invoice;
  }

  getBakurakuAuthorityCredit(){
    return this.bakurakuAuthority.credit;
  }

  getBakurakuAuthorityTeam(){
    return this.bakurakuAuthority.team;
  }

  getOutList(){
    return [this.crewMailList.length];
  }
}
