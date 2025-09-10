import { isValueUnique, isColumnUnique, validateUniqueConstraint } from "../../src/lib/unique-constraint";
import prisma from "../../src/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
	cell: {
		findFirst: jest.fn(),
	},
	column: {
		findUnique: jest.fn(),
	},
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Unique Constraint Functions", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("isValueUnique", () => {
		it("should return true for null/undefined/empty values", async () => {
			expect(await isValueUnique(1, null)).toBe(true);
			expect(await isValueUnique(1, undefined)).toBe(true);
			expect(await isValueUnique(1, "")).toBe(true);
		});

		it("should return true when no existing cell found", async () => {
			mockPrisma.cell.findFirst.mockResolvedValue(null);

			const result = await isValueUnique(1, "test-value");
			expect(result).toBe(true);
			expect(mockPrisma.cell.findFirst).toHaveBeenCalledWith({
				where: {
					columnId: 1,
					value: "test-value",
				},
			});
		});

		it("should return false when existing cell found", async () => {
			mockPrisma.cell.findFirst.mockResolvedValue({ id: 1, value: "test-value" } as any);

			const result = await isValueUnique(1, "test-value");
			expect(result).toBe(false);
		});

		it("should exclude specific row when provided", async () => {
			mockPrisma.cell.findFirst.mockResolvedValue(null);

			const result = await isValueUnique(1, "test-value", 5);
			expect(result).toBe(true);
			expect(mockPrisma.cell.findFirst).toHaveBeenCalledWith({
				where: {
					columnId: 1,
					value: "test-value",
					rowId: {
						not: 5,
					},
				},
			});
		});
	});

	describe("isColumnUnique", () => {
		it("should return true when column has unique constraint", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: true } as any);

			const result = await isColumnUnique(1);
			expect(result).toBe(true);
			expect(mockPrisma.column.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { unique: true },
			});
		});

		it("should return false when column does not have unique constraint", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: false } as any);

			const result = await isColumnUnique(1);
			expect(result).toBe(false);
		});

		it("should return false when column not found", async () => {
			mockPrisma.column.findUnique.mockResolvedValue(null);

			const result = await isColumnUnique(1);
			expect(result).toBe(false);
		});
	});

	describe("validateUniqueConstraint", () => {
		it("should return valid when column is not unique", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: false } as any);

			const result = await validateUniqueConstraint(1, "test-value");
			expect(result).toEqual({ isValid: true });
		});

		it("should return valid when value is unique", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: true } as any);
			mockPrisma.cell.findFirst.mockResolvedValue(null);

			const result = await validateUniqueConstraint(1, "test-value");
			expect(result).toEqual({ isValid: true });
		});

		it("should return invalid when value is not unique", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: true } as any);
			mockPrisma.cell.findFirst.mockResolvedValue({ id: 1, value: "test-value" } as any);

			const result = await validateUniqueConstraint(1, "test-value");
			expect(result).toEqual({
				isValid: false,
				error: 'Value "test-value" already exists. This column requires unique values.',
			});
		});

		it("should exclude row when provided", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({ unique: true } as any);
			mockPrisma.cell.findFirst.mockResolvedValue(null);

			const result = await validateUniqueConstraint(1, "test-value", 5);
			expect(result).toEqual({ isValid: true });
			expect(mockPrisma.cell.findFirst).toHaveBeenCalledWith({
				where: {
					columnId: 1,
					value: "test-value",
					rowId: {
						not: 5,
					},
				},
			});
		});
	});
});
