package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class User {
	Integer USER_IDX;
	String USER_ID, USER_NM, USER_E_MAIL, USER_TEL, USER_HP, USER_PSWD, USER_ROLE, USER_STATUS, USER_DEPT, USER_POSITION, HIRE_DT, RETIRE_DT;
}