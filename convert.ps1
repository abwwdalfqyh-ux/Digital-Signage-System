$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("C:\Users\ThinkPad\Downloads\الفصل الثالثعندما غيرنا الكلاس  (1).docx")
$text = $doc.Content.Text
$text | Out-File -FilePath "C:\Users\ThinkPad\Desktop\نظام اداره الاعلانات\الذي طلبهن الدكتور مبارك\النطام الجديد\newProject\DigitalSignage_V2\chapter3.txt" -Encoding UTF8
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Done converting"
