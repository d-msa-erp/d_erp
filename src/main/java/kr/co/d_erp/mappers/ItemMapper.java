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

}