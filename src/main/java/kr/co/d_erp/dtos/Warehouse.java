package kr.co.d_erp.dtos;

import lombok.Data;

@Data
public class Warehouse {
	Integer WH_IDX, WH_USER_IDX;
	String WH_CD, WH_NM, REMARK, WH_TYPE1, WH_TYPE2, WH_TYPE3, USE_FLAG, WH_LOCATION;
}