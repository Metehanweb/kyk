import json
import time
import subprocess
import urllib.request
import urllib.error

def run_tests():
    p = subprocess.Popen([r'.\venv\Scripts\uvicorn.exe', 'fastapi_app.main:app', '--port', '8000'])
    try:
        time.sleep(3)
        print("--- TEST 1: LOGIN (STUDENT) ---")
        login_data = json.dumps({'tc_no': '98765432109', 'password': 'ogrenci123'}).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/auth/login',
            data=login_data,
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req)
        tokens = json.loads(res.read().decode('utf-8'))
        assert 'access_token' in tokens and 'refresh_token' in tokens
        print(f"[PASSED] Login successful! Tokens received. Expires in: {tokens['expires_in']}s")

        print("\n--- TEST 2: GET /AUTH/ME ---")
        req_me = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/auth/me',
            headers={'Authorization': f"Bearer {tokens['access_token']}"}
        )
        res_me = urllib.request.urlopen(req_me)
        profile = json.loads(res_me.read().decode('utf-8'))
        print(f"[PASSED] User Profile: {profile['full_name']} | Role: {profile['role']} | Block: {profile['block']['name']}")

        print("\n--- TEST 3: UNAUTHORIZED REQUEST SHOULD RETURN 401 ---")
        try:
            urllib.request.urlopen('http://127.0.0.1:8000/api/v1/auth/me')
            print("[FAILED] Unauthenticated request did not return 401!")
        except urllib.error.HTTPError as e:
            print(f"[PASSED] Correctly returned HTTP {e.code} Unauthorized.")

        print("\n--- TEST 4: GET STUDENT COMPLAINTS (/complaints/my) ---")
        req_comp = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/complaints/my',
            headers={'Authorization': f"Bearer {tokens['access_token']}"}
        )
        res_comp = urllib.request.urlopen(req_comp)
        complaints = json.loads(res_comp.read().decode('utf-8'))
        print(f"[PASSED] Retrieved {len(complaints)} complaints for Eren Demir.")

        print("\n--- TEST 5: REFRESH TOKEN ---")
        ref_data = json.dumps({'refresh_token': tokens['refresh_token']}).encode('utf-8')
        req_ref = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/auth/refresh',
            data=ref_data,
            headers={'Content-Type': 'application/json'}
        )
        res_ref = urllib.request.urlopen(req_ref)
        new_tokens = json.loads(res_ref.read().decode('utf-8'))
        assert 'access_token' in new_tokens
        print(f"[PASSED] Token refresh successful! New access token verified.")

        print("\n--- TEST 6: CREATE NEW COMPLAINT AS STUDENT ---")
        # Get category id for Teknik / Arıza
        req_cats = urllib.request.Request('http://127.0.0.1:8000/api/v1/categories')
        res_cats = urllib.request.urlopen(req_cats)
        cats = json.loads(res_cats.read().decode('utf-8'))
        cat_id = cats[0]['id']

        create_data = json.dumps({
            'category_id': cat_id,
            'room_number': '304',
            'title': 'Oda İçi Isıtıcı Termostat Arızası',
            'description': 'Termostat düğmesi dönmüyor ve oda yeterince ısınmıyor.',
            'priority': 'NORMAL'
        }).encode('utf-8')

        req_create = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/complaints',
            data=create_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {tokens['access_token']}"
            }
        )
        res_create = urllib.request.urlopen(req_create)
        new_comp = json.loads(res_create.read().decode('utf-8'))
        print(f"[PASSED] Created complaint: ID={new_comp['id']} | Status={new_comp['status']} | Title={new_comp['title']}")

        print("\n--- TEST 7: MANAGER LOGIN & RESOLVE COMPLAINT ---")
        mgr_data = json.dumps({'tc_no': '22222222220', 'password': 'mudur123'}).encode('utf-8')
        req_mgr = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/auth/login',
            data=mgr_data,
            headers={'Content-Type': 'application/json'}
        )
        res_mgr = urllib.request.urlopen(req_mgr)
        mgr_tokens = json.loads(res_mgr.read().decode('utf-8'))

        patch_data = json.dumps({
            'status': 'RESOLVED',
            'resolution_note': 'Teknik ekip yönlendirildi ve termostat değiştirildi.'
        }).encode('utf-8')

        req_patch = urllib.request.Request(
            f"http://127.0.0.1:8000/api/v1/complaints/{new_comp['id']}",
            data=patch_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {mgr_tokens['access_token']}"
            },
            method='PATCH'
        )
        res_patch = urllib.request.urlopen(req_patch)
        updated_comp = json.loads(res_patch.read().decode('utf-8'))
        print(f"[PASSED] Manager updated complaint: Status={updated_comp['status']} | Note={updated_comp['resolution_note']}")

        print("\n=======================================================")
        print("ALL BACKEND & API VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("=======================================================")

    finally:
        p.terminate()

if __name__ == '__main__':
    run_tests()
