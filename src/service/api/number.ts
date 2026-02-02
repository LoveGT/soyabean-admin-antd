import { demoRequest } from '../request';

/** Add zodiac number */
export function fetchAddNumber(data: Api.Number.AddNumberParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/num/add',
    method: 'post',
    data
  });
}

/** Delete zodiac number */
export function fetchDeleteNumber(id: number) {
  return demoRequest<boolean>({
    url: '/api/sideline/zodiac/num/delete',
    method: 'get',
    params: { id }
  });
}
