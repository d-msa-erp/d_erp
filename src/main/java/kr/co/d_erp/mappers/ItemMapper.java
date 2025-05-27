package kr.co.d_erp.mappers;


import java.util.List;


import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.springframework.data.domain.Pageable;

import kr.co.d_erp.dtos.Item;


@Mapper
public interface ItemMapper {
	public List<Item> selectALLItem();
	List<Item> selectPagingItem(@Param("offset") int offset, @Param("pageSize") int pageSize);
	long selectCountItem();

	//삭제 메소드
	int deleteItems(@Param("itemIdx") List<Integer> itemIdx);
	
	//검색 메소드
	List<Item> getSearchItem(
			@Param("CsearchCat") String CsearchCat,
	        @Param("CsearchItem") String CsearchItem,
	        @Param("pageable") Pageable pageable
			);
	
	long getTotalSearchItemCount(
			@Param("CsearchCat") String CsearchCat,
	        @Param("CsearchItem") String CsearchItem
			);
	

	@Select("SELECT CUST_IDX FROM TB_CUSTMST WHERE CUST_NM = #{custNm}")
	Integer getCustIdxByCustNm(@Param("custNm") String custNm);
	
	@Update("UPDATE TB_CUSTMST SET CUST_NM = #{newCustNm} WHERE CUST_IDX = #{custIdx}")
    int updateCustNmByCustIdx(@Param("custIdx") int custIdx, @Param("newCustNm") String newCustNm);
	
	//거래처 조회
	List<Item> selectALLCust();
	
	//거래처 등록
	void insertCust(Item item);
	
	//대분류 조회
	List<Item> selectALLcat1();
	
	//소분류 조회
	List<Item> findALLcat2(@Param("PARENT_IDX") int PARENT_IDX);
	
	//단위 조회
	List<Item> selectUnits();
	
    // 특정 ID로 품목 조회
    Item selectItemById(int item_IDX);

    // 품목 정보 업데이트
    void updateItem(Item item);
    
    //품목 신규등록
    void insertItem(Item item);
    
    //품목 신규등록-품목코드 중복 조회
    @Select("SELECT COUNT(*) FROM TB_ITEMMST WHERE ITEM_CD = #{itemCd}")
    int countCdItem(@Param("itemCd") String itemCd);
    
    //품목 신규등록-대분류 조회
    @Select("SELECT CAT_IDX FROM TB_ITEM_CAT WHERE CAT_NM = #{catNm} AND PARENT_IDX IS NULL")
    Integer getParentCatIdxByCatNm(@Param("catNm") String catNm);
    
    //품목 신규등록-소분류 조회
    @Select("SELECT CAT_IDX FROM TB_ITEM_CAT WHERE CAT_NM = #{catNm} AND PARENT_IDX = #{parentIdx}")
    Integer getChildCatIdxByCatNm(@Param("catNm") String catNm, @Param("parentIdx") int parentIdx);
}
