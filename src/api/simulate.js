import request from '../utils/request'

export function simOperate(id, data) {
  return request({
    url: '/SimEngine/' + id,
    method: 'post',
    data
  })
}
