import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ExportService', () => {
    let service: ExportService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExportService,
                {
                    provide: PrismaService,
                    useValue: {}, // mock simples para os métodos
                },
            ],
        }).compile();

        service = module.get<ExportService>(ExportService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('CSV Generation (toCsv)', () => {
        it('should generate correct CSV with headers and rows', () => {
            const rows = [
                { id: '1', amount: '100.50', notes: 'OK' },
                { id: '2', amount: '200.00', notes: 'Test, with comma' },
                { id: '3', amount: '300.25', notes: 'Line\nBreak' },
            ];
            const headers = ['id', 'amount', 'notes'];

            const result = service.toCsv(rows, headers);

            const lines = result.split('\n');
            expect(lines.length).toBe(5);
            expect(lines[0]).toBe('id,amount,notes');
            expect(lines[1]).toBe('1,100.50,OK');
            expect(lines[2]).toBe('2,200.00,"Test, with comma"');
            expect(lines[3]).toBe('3,300.25,"Line');
            expect(lines[4]).toBe('Break"');
        });

        it('should handle empty rows correctly', () => {
            const headers = ['id', 'amount'];
            const result = service.toCsv([], headers);
            expect(result.trim()).toBe('id,amount');
        });
    });

    describe('Date Range Validation (validateDateRange)', () => {
        it('should throw BadRequest if dates are missing', () => {
            expect(() => service.validateDateRange('', '2025-01-01')).toThrow(BadRequestException);
            expect(() => service.validateDateRange('2025-01-01', '')).toThrow(BadRequestException);
        });

        it('should throw BadRequest if fromDate > toDate', () => {
            expect(() => service.validateDateRange('2025-12-31', '2025-01-01')).toThrow(BadRequestException);
        });

        it('should throw BadRequest if range exceeds maxDays', () => {
            // 200 days difference
            expect(() => service.validateDateRange('2025-01-01', '2025-07-20', 180)).toThrow(BadRequestException);
        });

        it('should return valid Date objects if range is correct', () => {
            const result = service.validateDateRange('2025-01-01', '2025-01-31', 180);
            expect(result.fromDate).toBeInstanceOf(Date);
            expect(result.toDate).toBeInstanceOf(Date);
            expect(result.fromDate.toISOString()).toBe(new Date('2025-01-01').toISOString());
        });
    });
});
