#!/bin/bash
# package-after-install.sh

set -e # Exit immediately if a command exits with a non-zero status.

APP_NAME="talk-electron" # Replace with your application's name
INSTALL_PATH="/opt/NC Talk Electron" # Replace with your application's install path
REAL_BINARY_NAME="${APP_NAME}.bin"  # Name of the executable file with .bin suffix
WRAPPER_PATH="$INSTALL_PATH/$APP_NAME" # Path to the wrapper script created by afterPack
USR_BIN_PATH="/usr/bin/$APP_NAME"
LINK_PRIORITY=50

echo "Running afterInstall script for $APP_NAME..."

# Check if the wrapper script created by afterPack exists
if [[ ! -f "$WRAPPER_PATH" ]]; then
  echo "Error: Wrapper script not found at expected location: $WRAPPER_PATH" >&2
  # Not necessarily a fatal error, but worth logging
  # exit 1 # Uncomment if you want strict behavior
  exit 0 # Assume the file might be elsewhere or isn't needed
fi

# Check if the file is a script (starts with #!)
if ! head -c 2 "$WRAPPER_PATH" | grep -q '#!'; then
    echo "Warning: File at $WRAPPER_PATH does not appear to be a script, skipping modification." >&2
    exit 0
fi

echo "Configuring update-alternatives for $APP_NAME..."
update-alternatives --install "$USR_BIN_PATH" "$APP_NAME" "$WRAPPER_PATH" $LINK_PRIORITY

# Create the correct absolute path to the .bin file
CORRECT_BIN_PATH="$INSTALL_PATH/$REAL_BINARY_NAME"

# Prepare the new line to execute the binary with the absolute path
NEW_EXEC_LINE="\"$CORRECT_BIN_PATH\" --no-sandbox \"\\\$@\""

# Create a temporary filename for the updated script
TEMP_WRAPPER_FILE=$(mktemp)

# Read the original script, replace the execution line, write to the temporary file
sed "2s|.*|${NEW_EXEC_LINE}|" "$WRAPPER_PATH" > "$TEMP_WRAPPER_FILE"

# Copy the permissions of the original file to the temporary file
chmod --reference="$WRAPPER_PATH" "$TEMP_WRAPPER_FILE"

# Replace the original file with the updated one
mv "$TEMP_WRAPPER_FILE" "$WRAPPER_PATH"

echo "Successfully updated --no-sandbox wrapper at $WRAPPER_PATH to use absolute path: $CORRECT_BIN_PATH"
