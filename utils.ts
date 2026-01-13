// ===== プロジェクト名から座席番号を抽出 =====
function extractSeatNumber(projectName: string): number | null {
  const match = projectName.match(/組み込みシステム基礎\s*\((\d+)\)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 80) {
      return num;
    }
  }
  return null;
}
export { extractSeatNumber };
