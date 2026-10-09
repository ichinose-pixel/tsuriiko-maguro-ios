export function resultSummary(state){
 const best=[...state.caughtDetails].sort((a,b)=>b.weight-a.weight)[0];
 return {best,isRecord:!!best&&state.newRecords.includes(best.type),isDiscovery:!!best&&state.newSpecies.includes(best.type)};
}
