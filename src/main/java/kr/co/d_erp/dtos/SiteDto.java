package kr.co.d_erp.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteDto {
	private String custCd;

	private String siteNm, ceoNm, bizNo,compNo,corpRegNo,bizCond,bizItem,bizTel,bizFax,bizAddr;
}