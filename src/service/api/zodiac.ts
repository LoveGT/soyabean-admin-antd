import { request } from '../request';

/** Get zodiac list */
export function fetchGetZodiacList() {
  return request<Api.Zodiac.ZodiacList[]>({
    url: '/sideline/zodiac/zh/list',
    method: 'get'
  });
}

/** Add zodiac */
export function fetchAddZodiac(data: Api.Zodiac.AddZodiacParams) {
  return request<number>({
    url: '/sideline/zodiac/zh/add',
    method: 'post',
    data
  });
}

/** Update zodiac */
export function fetchUpdateZodiac(data: Api.Zodiac.UpdateZodiacParams) {
  return request<number>({
    url: '/sideline/zodiac/zh/update',
    method: 'post',
    data
  });
}

/** Delete zodiac */
export function fetchDeleteZodiac(id: number) {
  return request<boolean>({
    url: '/sideline/zodiac/zh/delete',
    method: 'get',
    params: { id }
  });
}

/** Get zodiac home type */
export function fetchGetZodiacHomeType() {
  return request<Api.Zodiac.HomeType[]>({
    url: '/sideline/zodiac/zh/home-type',
    method: 'get'
  });
}
