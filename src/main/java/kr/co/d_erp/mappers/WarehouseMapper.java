package kr.co.d_erp.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.d_erp.dtos.Warehouse;

@Mapper
public interface WarehouseMapper {
	public List<Warehouse> selectAllWarehouse();

}