package kr.co.d_erp.daos;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.dtos.Warehouse;
import kr.co.d_erp.mappers.WarehouseMapper;

@Repository("WarehouseDao")
public class WarehouseDao implements WarehouseMapper {

	// OracleDB 연결
	@Autowired
	@Qualifier(value = "sqltemplate")
	private SqlSession sql1;

	@Override
	public List<Warehouse> selectAllWarehouse() {
		List<Warehouse> all = this.sql1.selectList("selectAllWarehouse");
		return all;
	}

}
