import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class StudentTaskManagementTester:
    def __init__(self, base_url="https://studyflow-267.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Flow...")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@test.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.test_data['admin_user'] = response.get('user', {})
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
        else:
            print("   ⚠️  Admin login failed - this will affect other tests")

        # Test student login
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": "student@test.com", "password": "student123"}
        )
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            self.test_data['student_user'] = response.get('user', {})
            print(f"   Student token obtained: {self.student_token[:20]}...")
        else:
            print("   ⚠️  Student login failed - this will affect other tests")

        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )

    def test_user_endpoints(self):
        """Test user management endpoints"""
        print("\n👥 Testing User Management...")
        
        if not self.admin_token:
            print("   ⚠️  Skipping user tests - no admin token")
            return

        # Test get students (admin only)
        success, response = self.run_test(
            "Get Students List",
            "GET",
            "users/students",
            200,
            token=self.admin_token
        )
        if success:
            self.test_data['students'] = response

        # Test unauthorized access
        self.run_test(
            "Unauthorized Student Access",
            "GET",
            "users/students",
            403,
            token=self.student_token
        )

    def test_task_management(self):
        """Test task creation and management"""
        print("\n📝 Testing Task Management...")
        
        if not self.admin_token:
            print("   ⚠️  Skipping task tests - no admin token")
            return

        # Create a test task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task for API testing",
            "difficulty": "Medium",
            "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
            "assigned_to": [self.test_data.get('student_user', {}).get('id')]
        }

        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks/",
            200,
            data=task_data,
            token=self.admin_token
        )
        if success:
            self.test_data['task_id'] = response.get('id')

        # Get all tasks (admin)
        self.run_test(
            "Get All Tasks (Admin)",
            "GET",
            "tasks/",
            200,
            token=self.admin_token
        )

        # Get tasks (student)
        self.run_test(
            "Get Student Tasks",
            "GET",
            "tasks/",
            200,
            token=self.student_token
        )

        # Get today's tasks
        if self.student_token:
            self.run_test(
                "Get Today's Tasks",
                "GET",
                "tasks/today",
                200,
                token=self.student_token
            )

    def test_submission_flow(self):
        """Test submission creation and management"""
        print("\n📤 Testing Submission Flow...")
        
        if not self.student_token or not self.test_data.get('task_id'):
            print("   ⚠️  Skipping submission tests - missing prerequisites")
            return

        # Create submission
        submission_data = {
            "task_id": self.test_data['task_id'],
            "content": "This is my test submission",
            "submission_type": "text"
        }

        success, response = self.run_test(
            "Create Submission",
            "POST",
            "submissions",
            200,
            data=submission_data,
            token=self.student_token
        )
        if success:
            self.test_data['submission_id'] = response.get('id')

        # Get submissions (student)
        self.run_test(
            "Get Student Submissions",
            "GET",
            "submissions",
            200,
            token=self.student_token
        )

        # Get submissions (admin)
        if self.admin_token:
            self.run_test(
                "Get All Submissions (Admin)",
                "GET",
                "submissions/",
                200,
                token=self.admin_token
            )

    def test_progress_tracking(self):
        """Test progress and leaderboard endpoints"""
        print("\n📊 Testing Progress Tracking...")
        
        if self.student_token:
            self.run_test(
                "Get My Progress",
                "GET",
                "progress/me",
                200,
                token=self.student_token
            )

        if self.admin_token:
            self.run_test(
                "Get Leaderboard",
                "GET",
                "progress/leaderboard",
                200,
                token=self.admin_token
            )

    def test_chat_system(self):
        """Test chat functionality"""
        print("\n💬 Testing Chat System...")
        
        if not self.admin_token or not self.student_token:
            print("   ⚠️  Skipping chat tests - missing tokens")
            return

        student_id = self.test_data.get('student_user', {}).get('id')
        if not student_id:
            print("   ⚠️  Skipping chat tests - no student ID")
            return

        # Create chat session
        success, response = self.run_test(
            "Create Chat Session",
            "POST",
            f"chat/sessions?student_id={student_id}",
            200,
            token=self.admin_token
        )
        if success:
            chat_id = response.get('id')
            self.test_data['chat_id'] = chat_id

            # Send message
            message_data = {
                "chat_id": chat_id,
                "content": "Hello, this is a test message",
                "sender_id": self.test_data.get('admin_user', {}).get('id')
            }
            
            self.run_test(
                "Send Message",
                "POST",
                "chat/messages",
                200,
                data=message_data,
                token=self.admin_token
            )

            # Get messages
            self.run_test(
                "Get Messages",
                "GET",
                f"chat/messages/{chat_id}",
                200,
                token=self.admin_token
            )

    def test_ai_features(self):
        """Test AI integration endpoints"""
        print("\n🤖 Testing AI Features...")
        
        if not self.student_token:
            print("   ⚠️  Skipping AI tests - no student token")
            return

        # Test doubt solver
        doubt_data = {
            "question": "What is the difference between a list and a tuple in Python?",
            "chat_history": []
        }

        self.run_test(
            "AI Doubt Solver",
            "POST",
            "ai/doubt-solver",
            200,
            data=doubt_data,
            token=self.student_token
        )

        # Test image analysis (with dummy base64)
        image_data = {
            "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "prompt": "Analyze this test image"
        }

        self.run_test(
            "AI Image Analysis",
            "POST",
            "ai/analyze-image",
            200,
            data=image_data,
            token=self.student_token
        )

    def test_announcements(self):
        """Test announcements functionality"""
        print("\n📢 Testing Announcements...")
        
        if not self.admin_token:
            print("   ⚠️  Skipping announcement tests - no admin token")
            return

        # Create announcement
        announcement_data = {
            "title": "Test Announcement",
            "content": "This is a test announcement for API testing",
            "priority": "medium"
        }

        success, response = self.run_test(
            "Create Announcement",
            "POST",
            "announcements/",
            200,
            data=announcement_data,
            token=self.admin_token
        )

        # Get announcements
        self.run_test(
            "Get Announcements",
            "GET",
            "announcements/",
            200,
            token=self.admin_token
        )

    def run_all_tests(self):
        """Run all test suites"""
        print(f"🚀 Starting API Tests for Student Task Management Platform")
        print(f"   Backend URL: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        try:
            response = requests.get(f"{self.api_url}/", timeout=5)
            if response.status_code == 200:
                print("✅ Backend connectivity confirmed")
            else:
                print(f"⚠️  Backend returned status {response.status_code}")
        except Exception as e:
            print(f"❌ Backend connectivity failed: {e}")
            return

        # Run test suites
        self.test_auth_flow()
        self.test_user_endpoints()
        self.test_task_management()
        self.test_submission_flow()
        self.test_progress_tracking()
        self.test_chat_system()
        self.test_ai_features()
        self.test_announcements()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failure.get('test', 'Unknown')}")
                if 'error' in failure:
                    print(f"      Error: {failure['error']}")
                else:
                    print(f"      Expected: {failure.get('expected')}, Got: {failure.get('actual')}")

        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = StudentTaskManagementTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())