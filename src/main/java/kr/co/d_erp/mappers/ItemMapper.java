package kr.co.d_erp.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.co.d_erp.dtos.Item;

@Mapper
public interface ItemMapper {
	public List<Item> selectALLItem();
	List<Item> selectPagingItem(@Param("offset") int offset, @Param("pageSize") int pageSize);
	long selectCountItem();

    // 특정 ID로 품목 조회
    Item selectItemById(int item_IDX);

    // 품목 정보 업데이트
    void updateItem(Item item);
}