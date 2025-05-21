package kr.co.d_erp.mappers;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import kr.co.d_erp.dtos.Item;

@Mapper
public interface CustMapper {
	@Select("SELECT CUST_IDX FROM TB_CUSTMST WHERE CUST_NM = #{custNm}")
	Integer getCustIdxByCustNm(@Param("custNm") String custNm);
	
	@Update("UPDATE TB_CUSTMST SET CUST_NM = #{newCustNm} WHERE CUST_IDX = #{custIdx}")
    int updateCustNmByCustIdx(@Param("custIdx") int custIdx, @Param("newCustNm") String newCustNm);
	
	void insertCust(Item item);
}
