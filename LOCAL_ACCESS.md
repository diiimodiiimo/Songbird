# Access App on Your Phone via Local Network

## Your Local IP: 192.168.1.66

## Quick Start:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **On your phone (same WiFi network), go to:**
   ```
   http://192.168.1.66:3000
   ```

3. **Make sure your `.env` has:**
   ```
   NEXTAUTH_URL=http://192.168.1.66:3000
   ```

## If it doesn't work:

1. **Check Windows Firewall:**
   - Windows might block port 3000
   - Go to Windows Defender Firewall → Allow an app
   - Allow Node.js through firewall

2. **Make sure phone and computer are on same WiFi**

3. **Try your computer's IP if 192.168.1.66 doesn't work:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter

## Credentials:
- Email: dimotesi44@gmail.com
- Password: password123



