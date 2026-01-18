/**
 * Merge Position Descriptions into Semantic Matrix
 *
 * Takes extracted position data from PDF and merges into semantic-matrix.json
 *
 * Usage: npx tsx scripts/merge-positions.ts
 */

import * as fs from "fs";
import * as path from "path";

// Position data extracted from cclk.pdf via Gemini
const extractedPositions = [
  {
    name: "Thiếu Thương",
    landmark: "ngón tay cái",
    relative: "Cách góc ngón tay cái 0,1 thốn"
  },
  {
    name: "Ngư Tế",
    landmark: "xương bàn ngón tay cái",
    relative:
      "Điểm giữa xương bàn ngón tay cái, nơi tiếp giáp da gan tay và da mu tay"
  },
  {
    name: "Thái Uyên",
    landmark: "cổ tay",
    relative: "Chỗ lõm trên động mạch quay, trên lằn chỉ cổ tay"
  },
  {
    name: "Kinh Cừ",
    landmark: "cẳng tay",
    relative:
      "Mặt trong đầu dưới xương quay, nếp gấp cổ tay thẳng lên 1 thốn"
  },
  {
    name: "Xích Trạch",
    landmark: "khuỷu tay",
    relative:
      "Trung điểm nếp gấp khuỷu tay, bờ ngoài cơ nhị đầu cánh tay"
  },
  {
    name: "Thương Dương",
    landmark: "ngón tay trỏ",
    relative: "Cách góc ngoài chân móng ngón tay trỏ 0,1 thốn"
  },
  {
    name: "Nhị Gian",
    landmark: "ngón tay trỏ",
    relative:
      "Chỗ lõm phía trước và ngoài xương bàn tay và ngón trỏ, nắm tay để lấy huyệt"
  },
  {
    name: "Tam Gian",
    landmark: "ngón tay trỏ",
    relative:
      "Chỗ lõm phía sau và ngoài xương bàn tay và ngón trỏ, nắm tay để lấy huyệt"
  },
  {
    name: "Hợp Cốc",
    landmark: "xương bàn ngón 2",
    relative:
      "Bờ ngoài xương bàn ngón 2, trung điểm đường nối 2 huyệt Tam Gian và Dương Khê"
  },
  {
    name: "Dương Khê",
    landmark: "cổ tay",
    relative:
      "Chỗ lõm bờ ngoài lằn sau cổ tay, khi cong ngón cái lên nằm tại hõm lào giải phẫu"
  },
  {
    name: "Khúc Trì",
    landmark: "khuỷu tay",
    relative:
      "Co khuỷu tay, huyệt nằm ở trên đầu lằn chỉ nếp gấp khuỷu nơi hõm vào"
  },
  {
    name: "Trung Xung",
    landmark: "ngón giữa",
    relative: "Điểm chính giữa đầu ngón giữa"
  },
  {
    name: "Lao Cung",
    landmark: "gan bàn tay",
    relative:
      "Trên gan bàn tay, khi nắm tay lại huyệt nằm giữa đầu móng tay ngón 3 và 4 chỉ vào"
  },
  {
    name: "Đại Lăng",
    landmark: "cổ tay",
    relative: "Ngay giữa nếp gấp cổ tay, giữa gân cơ tay lớn và tay bé"
  },
  {
    name: "Giản Sử",
    landmark: "cổ tay",
    relative:
      "Nếp gấp cổ tay thẳng lên 3 thốn, giữa khe gân cơ gan tay lớn và bé"
  },
  {
    name: "Quan Xung",
    landmark: "ngón đeo nhẫn",
    relative:
      "Bàn tay ngửa, cạnh ngoài gốc móng ngón đeo nhẫn (về phía ngón út) cách 0,1 thốn"
  },
  {
    name: "Dịch Môn",
    landmark: "ngón đeo nhẫn và ngón út",
    relative:
      "Úp bàn tay, cuối nếp gấp khe ngón đeo nhẫn và ngón út, bên ngoài khớp ngón và bàn tay"
  },
  {
    name: "Trung Chữ",
    landmark: "khớp ngón và bàn",
    relative:
      "Úp bàn tay, chỗ lõm sau khớp ngón và bàn trong khe xương bàn số 4 và 5"
  },
  {
    name: "Dương Trì",
    landmark: "cổ tay",
    relative:
      "Bàn tay úp, hơi gập cổ tay, chỗ lõm cạnh ngoài gân duỗi chung thẳng khe ngón 3-4"
  },
  {
    name: "Chi Cấu",
    landmark: "khuỷu tay",
    relative:
      "Bàn tay úp, khuỷu hơi co, từ huyệt Ngoại Quan lên 1 thốn, khe giữa 2 xương"
  },
  {
    name: "Thiên Tĩnh",
    landmark: "khuỷu tay",
    relative:
      "Ngồi ngay, co khuỷu tay, từ lồi mỏm khuỷu tay lên 1 thốn, giữa chỗ lõm"
  },
  {
    name: "Thiếu Xung",
    landmark: "ngón út",
    relative: "Phía xương mác ngón út, cách góc móng tay 0,1 thốn"
  },
  {
    name: "Thiếu Phủ",
    landmark: "xương bàn tay",
    relative:
      "Giữa xương bàn tay thứ 4-5, khi nắm tay huyệt ở giữa ngón út và ngón nhẫn hướng vào lòng bàn tay"
  },
  {
    name: "Thần Môn",
    landmark: "cổ tay",
    relative:
      "Phía xương trụ, trên lằn cổ tay, sau xương nguyệt, sát bờ ngoài gân cơ trụ trước"
  },
  {
    name: "Linh Đạo",
    landmark: "cẳng tay",
    relative: "Mặt trước trong cẳng tay, cách nếp gấp cổ tay 1,5 thốn"
  },
  {
    name: "Thiếu Hải",
    landmark: "khuỷu tay",
    relative:
      "Co tay, huyệt nằm giữa cuối đầu nếp gấp khuỷu tay và mỏm trên lồi cầu"
  },
  {
    name: "Thiếu Trạch",
    landmark: "ngón tay út",
    relative: "Góc trong chân móng ngón tay út, cách chân móng 0,1 thốn"
  },
  {
    name: "Tiền Cốc",
    landmark: "ngón tay út",
    relative:
      "Chỗ lõm xương ngón tay thứ 5, nắm tay lại huyệt ở trước lằn chỉ tay ngón út và bàn"
  },
  {
    name: "Hậu Khê",
    landmark: "bàn tay",
    relative:
      "Hơi nắm tay lại, huyệt nằm ở đầu trong đường vân tim của bàn tay"
  },
  {
    name: "Uyển Cốt",
    landmark: "bàn tay",
    relative:
      "Phía bờ trong bàn tay, chỗ lõm giữa xương móc và xương bàn tay thứ 5"
  },
  {
    name: "Dương Cốc",
    landmark: "cổ tay",
    relative:
      "Bờ trong cổ tay, chỗ lõm giữa xương đậu và mỏm trâm xương trụ"
  },
  {
    name: "Ẩn Bạch",
    landmark: "ngón chân cái",
    relative: "Góc trong ngón chân cái, cách móng chân 0,1 thốn"
  },
  {
    name: "Đại Đô",
    landmark: "ngón chân cái",
    relative:
      "Bờ trong xương ngón cái, trên đường tiếp giáp lằn da gan bàn chân dưới chỏm xương bàn chân"
  },
  {
    name: "Thái Bạch",
    landmark: "bàn chân",
    relative:
      "Chỗ lõm bờ trong bàn chân, sau khớp xương bàn ngón chân 1"
  },
  {
    name: "Thương Khâu",
    landmark: "mắt cá chân trong",
    relative:
      "Chỗ lõm phía trước mắt cá chân trong, giữa gân cơ cẳng chân sau và khớp sên-thuyền"
  },
  {
    name: "Âm Lăng Tuyền",
    landmark: "đầu gối",
    relative:
      "Chỗ lõm bờ sau trong đầu trên xương chày, cách nếp gấp đầu gối 2,5 thốn"
  },
  {
    name: "Đại Đôn",
    landmark: "ngón chân cái",
    relative: "Cách bờ ngoài gốc móng chân ngón cái 0,1 thốn"
  },
  {
    name: "Hành Gian",
    landmark: "kẽ ngón chân 1-2",
    relative: "Kẽ ngón chân 1-2 đo lên 0,5 thốn về phía mu chân"
  },
  {
    name: "Thái Xung",
    landmark: "kẽ ngón chân 1-2",
    relative: "Giữa kẽ ngón chân 1-2 đo lên 2 thốn về phía mu chân"
  },
  {
    name: "Trung Phong",
    landmark: "mắt cá trong",
    relative:
      "Bờ dưới mắt cá trong khoảng 1 thốn, điểm lõm giữa cơ dài ngón cái và cơ chày trước"
  },
  {
    name: "Khúc Tuyền",
    landmark: "nếp gấp đầu gối",
    relative:
      "Khi gấp chân lại, huyệt nằm trên phía trong xương đùi đầu nếp gấp đầu gối"
  },
  {
    name: "Lệ Đoài",
    landmark: "ngón chân thứ 2",
    relative: "Ngoài ngón chân thứ 2, cách góc móng chân 0,1 thốn"
  },
  {
    name: "Nội Đình",
    landmark: "kẽ ngón chân 2-3",
    relative: "Giữa kẽ ngón chân 2-3"
  },
  {
    name: "Hãm Cốc",
    landmark: "kẽ ngón chân 2-3",
    relative: "Giữa kẽ ngón chân 2-3, đo lên 0,5 thốn về phía mu chân"
  },
  {
    name: "Xung Dương",
    landmark: "mu bàn chân",
    relative:
      "Dưới huyệt Giải Khê 1,5 thốn, nơi cao nhất của mu bàn chân chỗ có động mạch đập"
  },
  {
    name: "Giải Khê",
    landmark: "nếp gấp cổ chân",
    relative:
      "Trên nếp gấp cổ chân giữa 2 gân cơ cẳng chân trước và gân cơ duỗi dài ngón cái"
  },
  {
    name: "Túc Tam Lý",
    landmark: "đầu gối",
    relative:
      "Úp bàn tay lên đầu gối, ngón giữa đặt trên xương chày cách 1 khoát ngón tay"
  },
  {
    name: "Dũng Tuyền",
    landmark: "lòng bàn chân",
    relative:
      "Dưới lòng bàn chân, điểm lõm khi co bàn chân, chỗ giữa ngón 2 và 3"
  },
  {
    name: "Nhiên Cốc",
    landmark: "bàn chân",
    relative:
      "Chỗ lõm sát bờ dưới xương trên đường nối da gan chân và mu chân"
  },
  {
    name: "Thái Khê",
    landmark: "mắt cá trong",
    relative:
      "Trung điểm đường nối bờ sau mắt cá trong và mép trong gân gót"
  },
  {
    name: "Phục Lưu",
    landmark: "gân gót",
    relative: "Từ huyệt Thái Khê đo thẳng lên 2 thốn, chỗ lõm trước gân gót"
  },
  {
    name: "Âm Cốc",
    landmark: "nếp gấp gối sau",
    relative:
      "Từ bờ sau nếp gấp gối, giữa gân cơ bán gân và gân cơ bán mạc"
  },
  {
    name: "Túc Khiếu Âm",
    landmark: "ngón chân thứ 4",
    relative:
      "Bên ngoài ngón chân thứ 4, cách góc móng chân 0,1 thốn, trên đường tiếp giáp da gan-mu chân"
  },
  {
    name: "Hiệp Khê",
    landmark: "kẽ ngón chân 4-5",
    relative:
      "Khe giữa xương bàn chân ngón 4-5, đầu kẽ giữa 2 ngón chân phía trên mu chân"
  },
  {
    name: "Túc Lâm Khấp",
    landmark: "khớp xương bàn ngón chân 4-5",
    relative: "Chỗ lõm phía trước khớp xương bàn ngón chân thứ 4-5"
  },
  {
    name: "Khâu Khư",
    landmark: "mắt cá ngoài",
    relative:
      "Phía trước và dưới mắt cá ngoài, chỗ lõm giữa huyệt Thân Mạch và Giải Khê"
  },
  {
    name: "Dương Phụ",
    landmark: "mắt cá ngoài",
    relative: "Trên đỉnh mắt cá ngoài 4 thốn, ở bờ dưới xương mác"
  },
  {
    name: "Dương Lăng Tuyền",
    landmark: "xương mác",
    relative:
      "Chỗ lõm phía trước và dưới đầu nhỏ xương mác, khe giữa cơ mác bên dài và cơ duỗi chung"
  },
  {
    name: "Chí Âm",
    landmark: "ngón út chân",
    relative: "Cạnh ngoài gốc móng ngón út chân, cách gốc móng 0,1 thốn"
  },
  {
    name: "Thông Cốc",
    landmark: "khớp bàn và ngón út chân",
    relative: "Chỗ lõm phía trước khớp bàn và ngón út"
  },
  {
    name: "Thúc Cốt",
    landmark: "xương bàn chân",
    relative:
      "Chỗ lõm cạnh ngoài, sau đầu nhỏ xương bàn chân nối với ngón 5"
  },
  {
    name: "Kinh Cốt",
    landmark: "bàn chân",
    relative:
      "Cạnh ngoài bàn chân, phía dưới đầu mẩu xương to (đầu trong xương bàn ngón út)"
  },
  {
    name: "Côn Lôn",
    landmark: "mắt cá ngoài",
    relative:
      "Phía sau mắt cá ngoài 0,5 thốn, giữa mắt cá và gân gót, đối chiếu với Thái Khê"
  },
  {
    name: "Ủy Trung",
    landmark: "khoeo chân",
    relative: "Giữa nếp gấp sau khoeo chân"
  }
];

interface HuyetPosition {
  landmark: string;
  relative: string;
}

interface Concept {
  id: string;
  name: string;
  kinh: string;
  nguHanh: string;
  nguDuHuyet: string;
  sourceFile: string;
  position?: HuyetPosition;
}

interface SemanticMatrix {
  version: number;
  generated: string;
  concepts: Concept[];
  matrix: Record<string, unknown>;
}

const CONFIG = {
  matrixPath: path.resolve(__dirname, "../src/data/semantic-matrix.json")
};

function normalizeHuyetName(name: string): string {
  // Normalize Vietnamese diacritics for comparison
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

function findMatchingPosition(
  conceptName: string
): { landmark: string; relative: string } | null {
  const normalizedConcept = normalizeHuyetName(conceptName);

  for (const pos of extractedPositions) {
    if (normalizeHuyetName(pos.name) === normalizedConcept) {
      return { landmark: pos.landmark, relative: pos.relative };
    }
  }

  // Fuzzy match: check if names are similar (within 2 char difference)
  for (const pos of extractedPositions) {
    const normalizedPos = normalizeHuyetName(pos.name);
    if (
      normalizedConcept.includes(normalizedPos) ||
      normalizedPos.includes(normalizedConcept)
    ) {
      return { landmark: pos.landmark, relative: pos.relative };
    }
  }

  return null;
}

async function main() {
  console.log("=== Merge Position Descriptions ===\n");

  // Load matrix
  console.log("Step 1: Loading semantic matrix...");
  const content = fs.readFileSync(CONFIG.matrixPath, "utf-8");
  const matrix: SemanticMatrix = JSON.parse(content);
  console.log(`Loaded ${matrix.concepts.length} concepts\n`);

  // Merge positions
  console.log("Step 2: Merging position data...");
  let matched = 0;
  let unmatched = 0;

  for (const concept of matrix.concepts) {
    const position = findMatchingPosition(concept.name);
    if (position) {
      concept.position = position;
      matched++;
      console.log(`  ✓ ${concept.name}`);
    } else {
      unmatched++;
      console.log(`  ✗ ${concept.name} (no match)`);
    }
  }

  // Update generated timestamp
  matrix.generated = new Date().toISOString();

  // Write updated matrix
  console.log("\nStep 3: Writing updated matrix...");
  fs.writeFileSync(CONFIG.matrixPath, JSON.stringify(matrix, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Matched: ${matched}/${matrix.concepts.length}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Coverage: ${((matched / matrix.concepts.length) * 100).toFixed(1)}%`);
  console.log("\n✓ Done!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
