// ライブラリのKintoneでやってる
function refreshGroupUsers(code, users){
  const options = {
    headers : {
      'Content-type': 'application/json',
      'X-Cybozu-Authorization': PropertiesService.getScriptProperties().getProperty('token'),
    },
    method : 'put',
    "muteHttpExceptions" : true,
    payload : JSON.stringify({
      'code': code,
      'users': users,
    }),
  };
  Logger.log(code);
  const res = UrlFetchApp.fetch(`https://<テナントURL>/v1/group/users.json`, options);
  Logger.log(res);
}