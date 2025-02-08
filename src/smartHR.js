const domain = 'https://<テナントid>.smarthr.jp';
const token = PropertiesService.getScriptProperties().getProperty('token');

function getCrewList(){
  let crewList = [];
  let index = 1;

  const params = {
    'method': 'GET',
    'headers': {'Authorization': `Bearer ${token}`,},
  };

  while(true){
    let response = UrlFetchApp.fetch(`${domain}/api/v1/crews?per_page=100&page=${index}`, params);
    let list = JSON.parse(response.getContentText());
    if(!list.length) break;
    crewList = crewList.concat(list.map(json => {
      const crew = new Crew();
      crew.setDataFromJson(json);
      return crew;
    }));
    index++;
  }
  return crewList;
}

