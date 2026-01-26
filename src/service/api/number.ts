import { request } from '../request';

/** Add zodiac number */
export function fetchAddNumber(data: Api.Number.AddNumberParams) {
  return request<number>({
    url: '/sideline/zodiac/num/add',
    method: 'post',
    data
  });
}

/** Delete zodiac number */
export function fetchDeleteNumber(id: number) {
  return request<boolean>({
    url: '/sideline/zodiac/num/delete',
    method: 'get',
    params: { id }
  });
}
