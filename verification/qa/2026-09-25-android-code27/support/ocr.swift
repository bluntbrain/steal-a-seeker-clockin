import Foundation
import Vision
let folder=URL(fileURLWithPath:CommandLine.arguments[1]); let files=try FileManager.default.contentsOfDirectory(at:folder,includingPropertiesForKeys:nil).filter{$0.pathExtension == "png"}.sorted{$0.lastPathComponent < $1.lastPathComponent}
var results:[String:[String]]=[:]
for f in files { let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate; request.recognitionLanguages=["en-US"]; do {try VNImageRequestHandler(url:f).perform([request]);results[f.lastPathComponent]=(request.results ?? []).compactMap{$0.topCandidates(1).first?.string}} catch {results[f.lastPathComponent]=["OCR error"]}}
let data=try JSONSerialization.data(withJSONObject:results,options:[.prettyPrinted,.sortedKeys]);try data.write(to:folder.deletingLastPathComponent().appendingPathComponent("support/screenshot-ocr.json"))
print("OCR completed: \(results.count)")
