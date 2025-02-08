const CREW = {
  status: {
    employed: 'employed',
  },
  authorityLevel: {
    employee: '社員',
  },
  position: {
    generalManager: '部長',
  },
};

class Crew{
  constructor(){
    this.rowIndex;
    this.email;
    this.id;
    this.emp_code;
    this.name = {
      last: undefined,
      family: undefined,
    };
    this.departments;
    this.positions;
    this.employment_type;
    this.entered_at;
    this.emp_status;
    this.authorityLevel;
  }

  setDataFromJson(json){

    const getName = (businessName, name) => businessName !== '' ? businessName : name;

    this.id = json.id;
    this.emp_code = parseInt(json.emp_code);
    this.name = {
      last: getName(json.business_first_name, json.first_name),
      family: getName(json.business_last_name, json.last_name),
    };
    this.departmentList = json.departments.map((d, index) => {
      return {
        name: d?.full_name,
        position: json.positions[index]?.name,
      };
    });
    this.employment_type = json.employment_type?.name;
    this.entered_at = dayjs.dayjs(json?.entered_at);
    this.emp_status = json.emp_status;
  }

  setDataFromSheet(row){
    this.id = row[SHEET.crew.column.id - 1];
    this.name = {
      last: row[SHEET.crew.column.name.last - 1],
      family: row[SHEET.crew.column.name.family - 1],
    };
    this.email = row[SHEET.crew.column.email - 1];
    this.emp_code = row[SHEET.crew.column.empCode - 1];
    this.entered_at = dayjs.dayjs(row[SHEET.crew.column.entered_at - 1]);
    this.emp_status = row[SHEET.crew.column.status - 1];
    this.authorityLevel = row[SHEET.crew.column.authorityLevel - 1];
    this.departmentList = SHEET.crew.column.departmentList.map(departmentIndex => {
      return {
        name: row[departmentIndex - 1],
        position: row[departmentIndex],
      };
    });
  }

  setAuthorityLevel(authorityLevel){
    this.authorityLevel = authorityLevel;
  }

  findSetEmail(kintoneMemberList){
    const member = kintoneMemberList.find(km => km.isSameId(this.emp_code));
    this.email = member?.getEmail();
  }

  isSame(crew){
    return this.id === crew.id;
  }

  isSameteam(team){
    return team.isSameAuthorityLevel(this.authorityLevel)
      && this.departmentList.some(d => team.isMatchDepartment(d.name)
      && team.isMatchPosition(d.position));
  }

  isSameStatus(emp_status){
    return this.emp_status === emp_status;
  }

  isSameAuthorityLevel(authorityLevel){
    return this.authorityLevel === authorityLevel;
  }

  isMatchDepartment(departmentName){
    return this.departmentList.some(d => d?.name?.includes(departmentName));
  }

  haveEmail(){
    return this.email.length > 0;
  }

  isBeforeJoin(){
    return dayjs.dayjs().isBefore(this.entered_at);
  }

  getName(){
    return `${this.name.family} ${this.name.last}`;
  }

  getEmail(){
    return this.email;
  }

  getEmpCode(){
    return this.emp_code;
  }

  getAuthorityLevel(){
    return this.authorityLevel;
  }

  generateAuthorityLevel(employmentTypeDic){
    this.authorityLevel = employmentTypeDic[this.employment_type];
  }

  getDepartmentList(){
    return this.departmentList;
  }

  getOutList(){
    return [
      this.id,
      this.emp_code,
      this.name.family,
      this.name.last,
      this.email,
      this.emp_status,
      this.entered_at.format('YYYY/MM/DD'),
      this.employment_type,
      this.authorityLevel
    ].concat(
      this.departmentList.reduce((outList, department) => outList.concat(department.name, department.position), [])
    );
  }
}
