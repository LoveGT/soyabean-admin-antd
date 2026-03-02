import { demoRequest } from '../request';

/** Get amount list */
export function fetchGetAmountList(data: Api.Amount.AmountListParams) {
  return demoRequest<Api.Amount.AmountListResponse>({
    url: '/api/sideline/zodiac/record/list',
    method: 'post',
    data
  });
}

/** Add amount by number */
export function fetchAddAmountByNum(data: Api.Amount.AddAmountByNumParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/record/add-by-num',
    method: 'post',
    data
  });
}

/** Add amount by zodiac */
export function fetchAddAmountByZodiac(data: Api.Amount.AddAmountByZodiacParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/record/add-by-zodiac',
    method: 'post',
    data
  });
}

/** Add amount custom */
export function fetchAddAmountCustom(data: Api.Amount.AddAmountCustomParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/record/add-by-custom',
    method: 'post',
    data
  });
}

/** Add amount */
export function fetchAddAmount(data: Api.Amount.AddAmountParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/record/add-amount',
    method: 'post',
    data
  });
}
/** Get amount list by num group */
export function fetchGetAmountListByNumGroup(data: Api.Amount.AmountListParams) {
  return demoRequest<Api.Amount.AmountListByNumGroupResponse>({
    url: '/api/sideline/zodiac/record/num-list',
    method: 'post',
    data
  });
}
// 根据号码属性查询号码信息
export function fetchGetNumByAttr(data: Api.Amount.NumByAttrParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/num/by-attr',
    method: 'get',
    params: data
  });
}

/** Delete amount */
// export function fetchDeleteAmount(id: number) {
//   return demoRequest<boolean>({
//     url: '/sideline/zodiac/record/delete',
//     method: 'get',
//     params: { id }
//   });
// }
