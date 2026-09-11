$ErrorActionPreference = 'Stop'
$moveRequest = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MediaDurableMove {
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool MoveFileExW(string source, string destination, uint flags);
}
'@
# MOVEFILE_WRITE_THROUGH (8), deliberately no REPLACE_EXISTING/COPY_ALLOWED.
if (-not [MediaDurableMove]::MoveFileExW($moveRequest.source, $moveRequest.destination, 8)) {
    throw 'Durable media move failed; operation remains unsubmitted.'
}
