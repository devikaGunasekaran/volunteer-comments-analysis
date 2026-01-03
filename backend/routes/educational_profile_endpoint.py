"""
Add endpoint to get complete student profile
"""

@educational_bp.route('/api/student-profile/<student_id>', methods=['GET'])
def get_student_profile(student_id):
    """
    Get complete student profile including TV, PV (with AI prediction), VI, RI, and Educational Details
    """
    try:
        query = """
            SELECT 
                s.studentId,
                s.name,
                s.district,
                s.phone,
                s.email,
                s.status as student_status,
                s.finalDecision,
                s.finalRemarks,
                s.finalDecisionDate,
                pv.verificationDate as pv_date,
                pv.sentiment as pv_recommendation,
                pv.comment as pv_comments,
                pv.elementsSummary as pv_elements,
                pv.sentiment_text as pv_sentiment_score,
                pv_vol.name as pv_volunteer_name,
                pv_vol.email as pv_volunteer_email,
                vi.interviewDate as vi_date,
                vi.status as vi_status,
                vi.overallRecommendation as vi_recommendation,
                vi.comments as vi_comments,
                vi.technicalScore as vi_technical_score,
                vi.communicationScore as vi_communication_score,
                vi_vol.name as vi_volunteer_name,
                vi_vol.email as vi_volunteer_email,
                ri.assignedDate as ri_assigned_date,
                ri.interviewDate as ri_date,
                ri.status as ri_status,
                ri.overallRecommendation as ri_recommendation,
                ri.remarks as ri_remarks,
                ri.technicalScore as ri_technical_score,
                ri.communicationScore as ri_communication_score,
                ri_vol.name as ri_volunteer_name,
                ri_vol.email as ri_volunteer_email,
                ed.collegeName,
                ed.degree,
                ed.stream,
                ed.branch,
                ed.yearOfPassing
            FROM Student s
            LEFT JOIN PhysicalVerification pv ON s.studentId = pv.studentId
            LEFT JOIN Volunteer pv_vol ON pv.volunteerId = pv_vol.volunteerId
            LEFT JOIN VirtualInterview vi ON s.studentId = vi.studentId
            LEFT JOIN Volunteer vi_vol ON vi.volunteerId = vi_vol.volunteerId
            LEFT JOIN RealInterview ri ON s.studentId = ri.studentId
            LEFT JOIN Volunteer ri_vol ON ri.volunteerId = ri_vol.volunteerId
            LEFT JOIN EducationalDetails ed ON s.studentId = ed.studentId
            WHERE s.studentId = %s
        """
        profile = fetchone_dict(query, (student_id,))
        
        if not profile:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({'success': True, 'profile': profile})
        
    except Exception as e:
        print(f"Error fetching student profile: {e}")
        return jsonify({'error': str(e)}), 500
