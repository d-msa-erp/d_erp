package kr.co.d_erp.daos;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.dtos.Customer;
import kr.co.d_erp.mappers.CustomerMapper;

@Repository("CustomerDao")
public class CustomerDao implements CustomerMapper {

	// OracleDB 연결
	@Autowired
	@Qualifier(value = "sqltemplate")
	private SqlSession sql1;
	
	@Override
	public List<Customer> ViewAllCustomer(String BIZ_FLAG) {
		List<Customer> AllList = sql1.selectList("ViewAllCustomer", BIZ_FLAG);
		return AllList;
	}
	
}
