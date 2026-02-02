import { demoRequest } from '../request';

/** Get zodiac list */
export function fetchGetZodiacList() {
  return demoRequest<Api.Zodiac.ZodiacList[]>({
    url: '/api/sideline/zodiac/zh/list',
    method: 'get'
  });
}

/** Add zodiac */
export function fetchAddZodiac(data: Api.Zodiac.AddZodiacParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/zh/add',
    method: 'post',
    data
  });
}

/** Update zodiac */
export function fetchUpdateZodiac(data: Api.Zodiac.UpdateZodiacParams) {
  return demoRequest<number>({
    url: '/api/sideline/zodiac/zh/update',
    method: 'post',
    data
  });
}

/** Delete zodiac */
export function fetchDeleteZodiac(id: number) {
  return demoRequest<boolean>({
    url: '/api/sideline/zodiac/zh/delete',
    method: 'get',
    params: { id }
  });
}

/** Get zodiac home type */
export function fetchGetZodiacHomeType() {
  return demoRequest<Api.Zodiac.HomeType[]>({
    url: '/api/sideline/zodiac/zh/home-type',
    method: 'get'
  });
}
