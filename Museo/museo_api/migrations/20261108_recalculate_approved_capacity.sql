UPDATE visitas_programadas v
SET cupo_actual =
    COALESCE((
        SELECT SUM(r.cantidad_personas)
        FROM public_reservations r
        WHERE r.id_visita = v.id_visita
          AND r.estado = 'aprobada'
    ), 0)
    + COALESCE((
        SELECT SUM(r.cantidad_personas)
        FROM institutional_reservations r
        WHERE r.id_visita = v.id_visita
          AND r.estado = 'aprobada'
    ), 0);
