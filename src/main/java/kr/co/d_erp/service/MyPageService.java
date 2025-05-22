package kr.co.d_erp.service;

import java.util.Optional;

import kr.co.d_erp.dtos.MyPageDto;

public interface MyPageService {
	//사용자 ID로 DTO 사용자정보 조회하기
	Optional<MyPageDto> getUserInfoByUserId(String userId);
	
	//사용자 정보 업데이트
	MyPageDto updateUserInfo(MyPageDto dto);
	
	//비밀번호 변경(추후)
	void updatePW(String userId, String newPW);
}