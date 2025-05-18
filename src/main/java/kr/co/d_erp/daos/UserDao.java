package kr.co.d_erp.daos;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.dtos.User;
import kr.co.d_erp.mappers.UserMapper;

@Repository("UserDao")
public class UserDao implements UserMapper{
	
	//OracleDB 연결
	@Autowired
	@Qualifier(value="sqltemplate")
	private SqlSession sql1;
	
	@Override
	public List<User> selectAllUsers(){
		List<User> all = this.sql1.selectList("selectAllUsers");
		return all;
	}
	
	
}