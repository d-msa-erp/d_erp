package kr.co.d_erp.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.d_erp.dtos.Customer;

@Mapper
public interface CustomerMapper {
	List<Customer> ViewAllCustomer(String BIZ_FLAG);
}
