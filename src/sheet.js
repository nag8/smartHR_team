const SHEET = {
  crew: {
    name: 'crew',
    row: {
      data: 3,
    },
    column: {
      id: 1,
      empCode: 2,
      name: {
        family: 3,
        last: 4,
      },
      email: 5,
      status: 6,
      entered_at: 7,
      authorityLevel: 9, // 半手動の設定項目。初期設定ではsmartHRの情報に割り振られるが、変更できるようにしている。ただし、変更したことはまだない。変更機能もいらないかも
      departmentList: [10, 12, 14],
    },
  },
  employmentType: {
    name: '[設定]雇用区分',
    row: {
      data: 2,
    },
    column: {
      employment_type: 1,
      authorityLevel: 2,
    },
  },
  team: {
    name: 'team',
    row: {
      data: 3,
    },
    column: {
      name: 1, // 例：部長
      authorityLevel: 2, // 例：crewシートで設定したauthorityLevel
      department: 3, // 例：営業部。この文言がsmartHRの部署の中にあればチームに入るようになる(条件①)
      position: 4, // 例：部長。この文言がsmartHRの役職の中にあればチームに入るようになる(条件②)
      memberNum: 5, // ある程度の確認のためにチームの人数が出るようにしている
      kintoneGroup: 6, // 入れてほしいkintoneグループ名
      googleGroup: 7, // 入れてほしいgoogleグループ名
      slack: {
        authority: 9, // なっていてほしいslack権限名。管理者など
        usergroupId: 10, // 入っていてほしいslackグループid
      },
      bakurakuAuthority: {
        user: 11, // 共通管理権限
        expenses: 12, // 申請・経費精算権限
        expensesApprove: 13, // 申請・経費精算権限承認
        invoice: 14, // 請求書受取・仕訳権限
        credit: 15, // ビジネスカード権限
        team: 16, // バクラク固定チーム
      },
    },
  },
  outsourcer: { // ここにメールアドレスを追加すればteamに所属させる
    name: '手動更新',
    row: {
      data: 3,
    },
    column: {
      email: 1,
      teamName: 2,
    },
  },
  bakurakuCrewIn: { // バクラクから出力したCSVを転記する。バクラクのidがほしいだけ
    name: 'in_バクラクメンバー',
    row: {
      data: 2,
    },
    column: {
      id: 1,
      email: 3,
    },
  },
  bakurakuCrewOut: { // バクラク更新用のCSVに出力先
    name: 'out_バクラクメンバー',
    row: {
      data: 2,
    },
    column: {
      id: 1,
    },
  },
  bakurakuManualTeam: { // 同じ名前の部署があり、そのままではどちらかに指定できないので、同名の部署のみここでチームidに変換する
    name: '[設定]バクラク部署',
    row: {
      data: 2,
    },
    column: {
      before: 1,
      after: 2,
    },
  },
};

function getCrewListFromSheet(){
  return Util.getSheetData(SHEET.crew).map(row => {
    const crew = new Crew();
    crew.setDataFromSheet(row);
    return crew;
  });
}

function getEmploymentTypeDic(){
  return Util.getSheetData(SHEET.employmentType).reduce((json, row) => {
    json[row[SHEET.employmentType.column.employment_type - 1]] = row[SHEET.employmentType.column.authorityLevel - 1];
    return json;
  }, {});
}

function getTeamList(){
  return Util.getSheetData(SHEET.team).map(row => new Team(row));
}

function getTeamListSetCrew(crewList, outsourcerList){
  return getTeamList().map(t => {
    t.findSetCrewMailList(crewList);
    t.findSetCrewFromOutsourcerList(outsourcerList);
    return t;
  });
}

function getBakurakuCrewList(){
  return Util.getSheetData(SHEET.bakurakuCrewIn).map(row => {
    return {
      id: row[SHEET.bakurakuCrewIn.column.id -1],
      email: row[SHEET.bakurakuCrewIn.column.email -1],
    };
  });
}


function getOutsourcerList(){
  return Util.getSheetData(SHEET.outsourcer).map(row => {
    return {
      email: row[SHEET.outsourcer.column.email -1],
      teamName: row[SHEET.outsourcer.column.teamName -1],
    };
  });
}

function getBakurakuManualTeamList(){
  return Util.getSheetData(SHEET.bakurakuManualTeam).map(row => {
    return {
      before: row[SHEET.bakurakuManualTeam.column.before -1],
      after: row[SHEET.bakurakuManualTeam.column.after -1],
    };
  });
}