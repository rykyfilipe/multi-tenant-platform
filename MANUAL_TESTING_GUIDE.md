# Manual Testing Guide - User Management Features ✅

## 🎯 Overview
This guide covers manual testing for the newly implemented features:
1. **Resend Invitation**
2. **User Deactivation/Activation**
3. **Dashboard Permissions**

---

## 🔧 Prerequisites

### 1. Environment Setup
```bash
# Start the development server
npm run dev

# In another terminal, start the database
docker-compose up -d  # if using Docker
```

### 2. Test Accounts Required
- **Admin Account**: Full access to all features
- **Editor Account**: Limited access for testing
- **Viewer Account**: Read-only access for testing

---

## 📋 Test Cases

### **Feature 1: Resend Invitation**

#### Test Case 1.1: Resend Valid Invitation
**Steps:**
1. Login as ADMIN
2. Navigate to `/home/users`
3. Click "Invite Member" button
4. Fill form:
   - Email: `newuser@test.com`
   - First Name: `Test`
   - Last Name: `User`
   - Role: `EDITOR`
5. Click "Send Invitation"
6. Wait for success message
7. Scroll to "Pending Invitations" section
8. Locate the invitation you just created
9. Click the "Resend" button (should appear for expired or near-expiry invitations)
10. Verify new success message

**Expected Results:**
- ✅ Resend button appears
- ✅ Success message: "Invitation resent successfully! Check your email."
- ✅ Invitation list refreshes with updated expiry date
- ✅ New email sent to recipient

**Verification:**
```sql
-- Check database for updated token and expiry
SELECT id, email, token, expiresAt, createdAt 
FROM "Invitation" 
WHERE email = 'newuser@test.com';
```

#### Test Case 1.2: Resend Expired Invitation
**Steps:**
1. Find an expired invitation in the list
2. Note the "Expired" badge displayed
3. Click "Resend" button

**Expected Results:**
- ✅ "Resend" button is visible for expired invitations
- ✅ Expiry date resets to +7 days from now
- ✅ "Expired" badge changes to time countdown

---

### **Feature 2: User Deactivation**

#### Test Case 2.1: Deactivate User
**Steps:**
1. Login as ADMIN
2. Navigate to `/home/users`
3. Locate an EDITOR or VIEWER user (not yourself)
4. Hover over the user row
5. Click the "Deactivate" button (UserX icon with amber color)
6. Confirm the action in the dialog
7. Verify success message

**Expected Results:**
- ✅ Confirmation dialog appears with warning message
- ✅ Success message: "User deactivated successfully"
- ✅ User status changes from "Active" (green dot) to "Inactive" (red dot)
- ✅ Button changes from UserX to UserCheck (green)
- ✅ User list refreshes automatically

**Verification:**
```sql
-- Check database
SELECT id, email, firstName, lastName, isActive, deactivatedAt, deactivatedBy 
FROM "User" 
WHERE email = 'editor@test.com';
```

#### Test Case 2.2: Deactivated User Cannot Login
**Steps:**
1. Deactivate a user (follow Test Case 2.1)
2. Open incognito/private browser window
3. Navigate to login page
4. Try to login with deactivated user credentials
   - Email: (deactivated user email)
   - Password: (their password)
5. Attempt login

**Expected Results:**
- ✅ Login fails
- ✅ Error message displayed (no specific "deactivated" message for security)
- ✅ User remains on login page
- ✅ Session is not created

**Console Verification:**
```
Check server logs for:
"Login attempt by deactivated user: [email]"
```

#### Test Case 2.3: Reactivate User
**Steps:**
1. Login as ADMIN
2. Navigate to `/home/users`
3. Locate a deactivated user (red dot, "Inactive" status)
4. Hover over the user row
5. Click the "Activate" button (UserCheck icon with green color)
6. Verify success message

**Expected Results:**
- ✅ Success message: "User activated successfully"
- ✅ User status changes from "Inactive" (red dot) to "Active" (green dot)
- ✅ Button changes from UserCheck back to UserX (amber)
- ✅ User can login again

**Verification:**
```sql
-- Check database
SELECT id, email, isActive, deactivatedAt, deactivatedBy 
FROM "User" 
WHERE email = 'editor@test.com';

-- isActive should be true, deactivatedAt and deactivatedBy should be NULL
```

#### Test Case 2.4: Cannot Deactivate Last Admin
**Steps:**
1. Login as ADMIN
2. Navigate to `/home/users`
3. Verify you are the only ADMIN
4. Try to deactivate yourself OR another admin if you have multiple admins

**Expected Results:**
- ✅ If last admin: Error message "Cannot deactivate the last admin. Assign another admin first."
- ✅ Action is blocked
- ✅ No database changes

#### Test Case 2.5: Non-Admin Cannot Deactivate
**Steps:**
1. Login as EDITOR or VIEWER
2. Navigate to `/home/users`
3. Verify deactivate/activate buttons are NOT visible

**Expected Results:**
- ✅ Buttons are hidden for non-admin users
- ✅ If accessed via API: 401 Unauthorized error

---

### **Feature 3: Dashboard Permissions**

#### Test Case 3.1: View Dashboard Permissions
**Steps:**
1. Login as ADMIN
2. Navigate to `/home/dashboards`
3. Click on a dashboard
4. Navigate to `/home/dashboards/[dashboardId]/permissions`
   - Or add a "Permissions" button to dashboard UI (pending implementation)

**Expected Results:**
- ✅ Permissions page loads
- ✅ List of all tenant users displayed
- ✅ Each user shows 4 toggle switches:
   - View (blue)
   - Edit (primary)
   - Delete (red)
   - Share (green)
- ✅ Current permissions are reflected in toggles

#### Test Case 3.2: Grant View Permission
**Steps:**
1. On dashboard permissions page
2. Find a VIEWER user
3. Toggle "View" permission ON (blue switch)
4. Click "Save Changes"

**Expected Results:**
- ✅ "Unsaved Changes" badge appears when toggle is changed
- ✅ Success message: "Dashboard permissions saved successfully!"
- ✅ Toggle remains ON after save
- ✅ Changes persist after page refresh

**Verification:**
```sql
-- Check database
SELECT * FROM "DashboardPermission" 
WHERE dashboardId = [ID] AND userId = [USER_ID];
```

#### Test Case 3.3: Revoke Permissions
**Steps:**
1. Grant permissions to a user (Test Case 3.2)
2. Toggle all permissions OFF
3. Click "Save Changes"

**Expected Results:**
- ✅ All toggles turn OFF
- ✅ Success message displayed
- ✅ Permissions removed from database

#### Test Case 3.4: Bulk Permission Update
**Steps:**
1. Toggle multiple permissions for multiple users:
   - User A: View + Edit
   - User B: View only
   - User C: View + Edit + Delete + Share
2. Click "Save Changes"

**Expected Results:**
- ✅ All changes saved in a single request
- ✅ Success message displayed once
- ✅ All permissions correctly saved to database

#### Test Case 3.5: Non-Admin Cannot Access Permissions
**Steps:**
1. Login as EDITOR or VIEWER
2. Try to navigate to `/home/dashboards/[dashboardId]/permissions`

**Expected Results:**
- ✅ 401 Unauthorized error
- ✅ Redirect to home or error page

---

## 🧪 Edge Cases & Error Handling

### Edge Case 1: Rapid Toggle Clicks
**Steps:**
1. On permissions page
2. Rapidly click same toggle multiple times
3. Click "Save Changes"

**Expected Results:**
- ✅ Final toggle state is saved correctly
- ✅ No duplicate permissions created
- ✅ No database errors

### Edge Case 2: Network Failure During Save
**Steps:**
1. Open browser DevTools > Network tab
2. Set network to "Offline"
3. Change permissions
4. Click "Save Changes"
5. Re-enable network

**Expected Results:**
- ✅ Error message displayed
- ✅ "Unsaved Changes" badge remains
- ✅ No data loss
- ✅ User can retry save

### Edge Case 3: Concurrent Admin Actions
**Steps:**
1. Two admins open same permissions page
2. Admin A changes permissions for User 1
3. Admin B changes permissions for User 2
4. Both save simultaneously

**Expected Results:**
- ✅ Both saves succeed
- ✅ No conflict
- ✅ Last write wins for each user's permissions

---

## 📊 Performance Tests

### Performance Test 1: Large User List
**Scenario:** 100+ users in tenant

**Steps:**
1. Create test tenant with 100 users
2. Navigate to permissions page
3. Measure page load time

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ UI remains responsive
- ✅ No scroll lag

### Performance Test 2: Bulk Permission Save
**Scenario:** Save permissions for 50+ users at once

**Steps:**
1. Change permissions for 50 users
2. Click "Save Changes"
3. Measure save time

**Expected Results:**
- ✅ Save completes in < 5 seconds
- ✅ Success message appears
- ✅ No timeout errors

---

## 🔍 Validation Checklist

### UI/UX Validation
- [ ] All buttons have hover states
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Success messages are visible and auto-dismiss
- [ ] Icons match intended actions
- [ ] Colors follow design system:
  - Deactivate: Amber/Yellow
  - Activate: Green
  - Delete: Red
  - View permission: Blue
  - Edit permission: Primary
  - Delete permission: Red
  - Share permission: Green/Emerald

### Security Validation
- [ ] Only ADMINs can deactivate users
- [ ] Only ADMINs can activate users
- [ ] Only ADMINs can manage dashboard permissions
- [ ] Deactivated users cannot login
- [ ] Sessions are deleted on deactivation
- [ ] Cannot deactivate last admin

### Data Integrity
- [ ] All database constraints are respected
- [ ] Cascade deletes work correctly
- [ ] No orphaned records
- [ ] Timestamps are accurate

---

## 🐛 Bug Reporting Template

If you find a bug during testing, report it with this format:

```
**Title:** [Brief description]

**Feature:** [Resend Invitation / User Deactivation / Dashboard Permissions]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: 
- OS: 
- User Role: 
```

---

## ✅ Final Verification

After completing all tests, verify:

1. **Database State:**
```sql
-- Check for any inconsistencies
SELECT * FROM "User" WHERE isActive IS NULL;
SELECT * FROM "DashboardPermission" WHERE userId NOT IN (SELECT id FROM "User");
SELECT * FROM "Invitation" WHERE expiresAt < NOW() AND accepted = false;
```

2. **Logs Review:**
```bash
# Check for any errors in server logs
tail -f logs/application.log | grep ERROR
```

3. **User Feedback:**
- Test with real users if possible
- Gather feedback on UX flow
- Document any confusion points

---

## 📝 Test Results Template

```
**Test Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]

### Resend Invitation
- [ ] Test 1.1: Passed/Failed
- [ ] Test 1.2: Passed/Failed

### User Deactivation
- [ ] Test 2.1: Passed/Failed
- [ ] Test 2.2: Passed/Failed
- [ ] Test 2.3: Passed/Failed
- [ ] Test 2.4: Passed/Failed
- [ ] Test 2.5: Passed/Failed

### Dashboard Permissions
- [ ] Test 3.1: Passed/Failed
- [ ] Test 3.2: Passed/Failed
- [ ] Test 3.3: Passed/Failed
- [ ] Test 3.4: Passed/Failed
- [ ] Test 3.5: Passed/Failed

**Overall Status:** ✅ All Passed / ⚠️ Some Issues / ❌ Failed

**Notes:**
[Any additional observations or issues]
```

---

**Testing Complete! 🎉**

Once all tests pass, the features are ready for production deployment.

