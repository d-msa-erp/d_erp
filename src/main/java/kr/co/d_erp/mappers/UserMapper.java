package kr.co.d_erp.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.d_erp.dtos.User;

@Mapper
public interface UserMapper {
	public List<User> selectAllUsers();

}