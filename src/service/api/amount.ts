import { request } from '../request';

/** Get amount list */
export function fetchGetAmountList(data: Api.Amount.AmountListParams) {
  return request<Api.Amount.AmountListResponse>({
    url: '/sideline/zodiac/record/list',
    method: 'post',
    data
  });
}

/** Add amount by number */
export function fetchAddAmountByNum(data: Api.Amount.AddAmountByNumParams) {
  return request<number>({
    url: '/sideline/zodiac/record/add-by-num',
    method: 'post',
    data
  });
}

/** Add amount by zodiac */
export function fetchAddAmountByZodiac(data: Api.Amount.AddAmountByZodiacParams) {
  return request<number>({
    url: '/sideline/zodiac/record/add-by-zodiac',
    method: 'post',
    data
  });
}

/** Add amount custom */
export function fetchAddAmountCustom(data: Api.Amount.AddAmountCustomParams) {
  return request<number>({
    url: '/sideline/zodiac/record/add-by-custom',
    method: 'post',
    data
  });
}

/** Delete amount */
export function fetchDeleteAmount(id: number) {
  return request<boolean>({
    url: '/sideline/zodiac/record/delete',
    method: 'get',
    params: { id }
  });
}
