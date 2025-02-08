const BAKURAKU_CREW = {
  status: {
    valid: '有効',
  },
  authorityLevel: {
    general: '一般',
    viewOnly: '閲覧者',
    userAdmin: 'ユーザー管理者',
    admin: '管理者',
    inValid: '',
    approve : '承認',
  },
  position: {
    ceo: '社長',
    director: '取締役',
    board: '役員',
    generalManager: '部長',
    manager: 'マネージャー',
    member: 'メンバー',
  }
};

class BakurakuCrew{
  constructor(){
    this.email;
    this.name;
    this.id;
    this.emp_code;
    this.departmentList = [];
  }

  setDataFromSheet(row){
    this.id = row[SHEET.crew.column.id - 1];
    this.email = row[SHEET.crew.column.email - 1];
  }

  setDataFromSmartHRCrew(crew){
    this.name = crew.getName();
    this.email = crew.getEmail();
    this.emp_code = crew.getEmpCode();
    this.departmentList = crew.getDepartmentList();
  }

  isSameEmail(email){
    return this.email === email;
  }

  isNoId(){
    return this.id === undefined;
  }

  isDirector(){
    return this.departmentList.some(d => d.position === BAKURAKU_CREW.position.director);
  }

  findSetId(bakurakuCrewList){
    this.id = bakurakuCrewList.find(bc => this.isSameEmail(bc.email))?.id;
  }

  getDepertmentList(){
    return this.departmentList;
  }



  getOutList(teamList, bakurakuManualTeamList){

    const joinTeamList = teamList.filter(t => t.isIncludesEmail(this.email));

    const getDepertmentText = (joinTeamList, bakurakuManualTeamList) => {

      return this.departmentList.reduce((dList, department) => {
        let departmentName = department.name;
        if(departmentName === '') return dList;

        bakurakuManualTeamList.forEach(mt => {
          departmentName = departmentName.replace(mt.before, mt.after);
        });

        const getpositionText = position => {
          const p = [
            BAKURAKU_CREW.position.ceo,
            BAKURAKU_CREW.position.director,
            BAKURAKU_CREW.position.board,
            BAKURAKU_CREW.position.generalManager,
            BAKURAKU_CREW.position.manager
          ].find(p => position.includes(p));

          return (p === undefined) ? BAKURAKU_CREW.position.member : p;
        };

        return dList.concat(departmentName.split('/').pop() + `{{${getpositionText(department.position)}}}`);
      }, [])
      .concat(joinTeamList.reduce((dList, t) => {
        const teamName = t.getBakurakuAuthorityTeam();
        return (teamName === '') ? dList : dList.concat(`${teamName}{{${BAKURAKU_CREW.position.member}}}`);
      }, []))
      .join(';');
    };

    const getAuthorityDic = joinTeamList => {
      let authority = {
        user: BAKURAKU_CREW.authorityLevel.general,
        expenses: BAKURAKU_CREW.authorityLevel.inValid,
        expensesApprove: BAKURAKU_CREW.authorityLevel.inValid,
        invoice: BAKURAKU_CREW.authorityLevel.general,
        credit: BAKURAKU_CREW.authorityLevel.general,
      };
      const getAuthority = (authorityList, authority) => {
        return authorityList.reduce((authority, a) => (a !== '') ? a : authority, authority);
      };

      authority.user = getAuthority(joinTeamList.map(t => t.getBakurakuAuthorityUser()), authority.user);
      authority.expenses = getAuthority(joinTeamList.map(t => t.getBakurakuAuthorityExpenses()), authority.expenses);
      authority.expensesApprove = getAuthority(joinTeamList.map(t => t.getBakurakuAuthorityExpensesApprove()), authority.expensesApprove);
      authority.invoice = getAuthority(joinTeamList.map(t => t.getBakurakuAuthorityInvoice()), authority.invoice);
      authority.credit = getAuthority(joinTeamList.map(t => t.getBakurakuAuthorityCredit()), authority.credit);

      return authority;
    };

    const authorityDic = getAuthorityDic(joinTeamList);

    const sendMailFlg = '';
    const getAuthorityFlg = authority => authority !== '' ? 1 : 0;

    return [
      this.id,
      this.name,
      this.email,
      this.emp_code,
      authorityDic.user,
      sendMailFlg,
      BAKURAKU_CREW.status.valid,
      getDepertmentText(joinTeamList, bakurakuManualTeamList),
      getAuthorityFlg(authorityDic.expenses),
      (authorityDic.expenses === BAKURAKU_CREW.authorityLevel.inValid) ? BAKURAKU_CREW.authorityLevel.viewOnly : authorityDic.expenses,
      getAuthorityFlg(authorityDic.invoice),
      authorityDic.invoice,
      getAuthorityFlg(authorityDic.expensesApprove),
      getAuthorityFlg(authorityDic.credit),
      authorityDic.credit
    ];
  }
}