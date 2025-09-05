interface BaseResponse<T> {
  success: boolean;
  data: T;
}

export default BaseResponse;