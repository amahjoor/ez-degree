package com.twentysixprojects.patriotassist.patriotassist_gmu;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseAbbr.GetCourseAbbr;
import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseData.ObtainCourseData;
import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.CourseHasLab.CourseHasLab;
import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.MasonCore.MasonCore;
import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.RMP.GetRMPData;
import com.twentysixprojects.patriotassist.patriotassist_gmu.DataRetrieval.ScheduleData.ScheduleDataObtainer;
import com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.GenerateScheduleLogic;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class PatriotassistGmuApplication {

	public static void main(String[] args) {
		SpringApplication.run(PatriotassistGmuApplication.class, args);
	}


	@Autowired
    private CourseHasLab CourseHasLabObj;

	@Autowired
	private GetRMPData GetRMPDataObj;
	
	@Autowired
	private MasonCore GetMasonCore; 

	@Autowired
	private GetCourseAbbr GetCourseAbbrObj;

	@PostConstruct
	public void OnStart()
	{
		//ScheduleDataObtainer ScheduleDataObtainerObj = new ScheduleDataObtainer();
		//ScheduleDataObtainerObj.GetScheduleData();

		//ObtainCourseData ObtainCourseDataObj = new ObtainCourseData();
		//ObtainCourseDataObj.GetCourseData();

		//CourseHasLabObj.getHasLab();

		//GetRMPDataObj.getRMPData();

		//GetMasonCore.GetCourseData();

		//GetCourseAbbrObj.LoadCourseAbbr();
	}

}
