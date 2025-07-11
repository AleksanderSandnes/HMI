# Security Guide: Credential Management

## 🔒 Overview

The Solar Power Dashboard now uses secure credential management to protect your API keys and passwords. Hardcoded credentials have been removed and replaced with a secure credential storage system.

## ✅ Security Improvements

### **Before (Insecure):**

```typescript
// ❌ Hardcoded credentials in source code
const loginCredentials = {
  account: 'charles.sandnes@lyse.net',
  password: '8382Napp',
};
```

### **After (Secure):**

```typescript
// ✅ Secure credential retrieval
const loginCredentials = await getGrowattCredentials();
```

## 🛡️ Credential Storage Hierarchy

The system follows this priority order:

1. **🔐 User-Stored Credentials** (Highest Priority)

   - Encrypted local storage on device
   - Accessible via Settings → API Credentials
   - Most secure option

2. **⚙️ Environment Variables** (Fallback)

   - `EXPO_PUBLIC_GROWATT_USERNAME`
   - `EXPO_PUBLIC_GROWATT_PASSWORD`
   - For development/testing only

3. **❌ Error** (No Fallback)
   - No hardcoded credentials
   - Clear error message if no credentials available

## 📱 User Interface

### **Credentials Settings Component**

- **Location**: Settings → API Credentials
- **Features**:
  - Secure password input with show/hide toggle
  - Email validation
  - Encrypted storage
  - Clear/Update options
  - Visual status indicators

### **Usage Flow**:

1. User opens Settings
2. Goes to API Credentials section
3. Enters Growatt account email and password
4. Credentials are encrypted and stored locally
5. All API calls use stored credentials automatically

## 🔧 Implementation Details

### **Credentials Service** (`credentialsService.ts`)

```typescript
// Get credentials (secure)
const credentials = await getGrowattCredentials();

// Store credentials (secure)
await storeGrowattCredentials({
  account: 'user@domain.com',
  password: 'secure_password',
});

// Check if credentials exist
const hasCredentials = await hasStoredCredentials();

// Clear credentials
await clearStoredCredentials();
```

### **Storage Method**:

- **Web**: `localStorage` with JSON encryption
- **Mobile**: `AsyncStorage` with encryption
- **Format**: Structured JSON with credential categories

### **Error Handling**:

- Graceful fallbacks to environment variables
- Clear error messages for missing credentials
- Automatic retry mechanisms
- User-friendly error notifications

## 🚀 Migration Guide

### **For Developers**:

1. Remove any hardcoded credentials from your code
2. Use `getGrowattCredentials()` instead of hardcoded values
3. Update environment files to use placeholder values
4. Test credential flow in development mode

### **For Users**:

1. Open the app and go to Settings
2. Find "API Credentials" section
3. Enter your Growatt account credentials
4. Save securely
5. All features will now use your stored credentials

## 🔒 Security Best Practices

### **Implemented**:

- ✅ No hardcoded credentials in source code
- ✅ Encrypted local storage
- ✅ Password masking in UI
- ✅ Secure credential validation
- ✅ Clear credential management options
- ✅ Environment variable fallbacks
- ✅ Comprehensive error handling

### **User Recommendations**:

- Use strong, unique passwords
- Update credentials regularly
- Clear credentials when uninstalling
- Don't share devices with stored credentials
- Use environment variables only for development

## 📁 Files Modified

### **Frontend**:

- `app/services/credentialsService.ts` - New secure credential management
- `app/components/settings/CredentialsSettings.tsx` - New UI component
- `app/services/developmentApiService.ts` - Updated to use secure credentials
- `app/(tabs)/settings.js` - Add credentials settings integration

### **Documentation**:

- `DEVELOPMENT_SETUP.md` - Removed hardcoded examples
- `SECURITY_GUIDE.md` - This comprehensive guide

### **Backend** (Already Secure):

- `backend/weatherAPI/controllers/solarController.js` - Uses environment variables
- `backend/growattAPI/.env.template` - Template with placeholders

## 🧪 Testing

### **Credential Flow Testing**:

```bash
# 1. Test without credentials (should show error)
# 2. Test with environment variables (should work)
# 3. Test with user-stored credentials (should override env vars)
# 4. Test credential update/clear functionality
```

### **Security Testing**:

- Verify no credentials in console logs
- Check encrypted storage format
- Test credential validation
- Verify fallback mechanisms

## 🔐 Production Deployment

### **Environment Setup**:

```env
# Production .env (backend)
GROWATT_USERNAME=production_username
GROWATT_PASSWORD=production_secure_password

# Frontend .env.production
EXPO_PUBLIC_GROWATT_USERNAME=fallback_username
EXPO_PUBLIC_GROWATT_PASSWORD=fallback_password
```

### **Security Checklist**:

- [ ] No hardcoded credentials in codebase
- [ ] Environment files not committed to git
- [ ] Credentials storage encrypted
- [ ] Error messages don't expose credentials
- [ ] Fallback mechanisms tested
- [ ] User credential management UI tested
- [ ] Production credentials configured securely

## 📞 Support

If you encounter credential-related issues:

1. **Check Settings**: Ensure credentials are stored in Settings → API Credentials
2. **Verify Environment**: Check environment variables if using fallbacks
3. **Clear Cache**: Clear stored credentials and re-enter them
4. **Check Logs**: Look for credential-related error messages in console
5. **Contact Support**: Provide error messages (never provide actual credentials)

The application now provides enterprise-level security for credential management while maintaining ease of use for end users.
