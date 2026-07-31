Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WindowUtils {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
}
"@

# Change 'notepad' to your target process name
$process = Get-Process -Name "notepad" -ErrorAction SilentlyContinue

if ($process) {
    $rect = New-Object WindowUtils+RECT
    
    if ([WindowUtils]::GetWindowRect($process.MainWindowHandle, [ref]$rect)) {
        # Calculate Size
        $width = $rect.Right - $rect.Left
        $height = $rect.Bottom - $rect.Top
        
        # Position is directly retrieved from the Top-Left coordinates
        $posX = $rect.Left
        $posY = $rect.Top
        
        Write-Host "--- Window Dimensions ---"
        Write-Host "Width:  $width px"
        Write-Host "Height: $height px"
        Write-Host "--- Window Position ---"
        Write-Host "X Coordinate (Left): $posX"
        Write-Host "Y Coordinate (Top):  $posY"
    }
} else {
    Write-Host "Process not found. Make sure the application is running."
}
