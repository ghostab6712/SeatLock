INSERT INTO seats (seat_number)
VALUES
    ('A1'),
    ('A2'),
    ('A3'),
    ('A4'),
    ('A5')
ON CONFLICT (seat_number) DO NOTHING;