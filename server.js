const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Supabase
const supabaseUrl = 'https://eltstnrporsyhizomiot.supabase.co';
const supabaseKey = 'sb_publishable_tz7QOR6yeebUDYKbVjWLEQ_P-TS_jau';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Obtener todos los turnos para un día específico
app.get('/api/appointments', async (req, res) => {
    const { date } = req.query;
    
    try {
        let query = supabase.from('appointments').select('*');
        if (date) {
            query = query.eq('date', date);
        }
        
        const { data: appointments, error } = await query;
        
        if (error) {
            throw error;
        }
        
        res.json(appointments || []);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: 'Error al obtener los turnos' });
    }
});

// Crear un nuevo turno
app.post('/api/appointments', async (req, res) => {
    const { clientName, date, time } = req.body;
    
    if (!clientName || !date || !time) {
        return res.status(400).json({ error: 'Faltan datos obligatorios: clientName, date o time' });
    }

    try {
        // Verificar si el turno ya está ocupado
        const { data: existingApp, error: searchError } = await supabase
            .from('appointments')
            .select('*')
            .eq('date', date)
            .eq('time', time)
            .maybeSingle(); 
            
        // Si encontró uno, ya está ocupado
        if (existingApp) {
            return res.status(409).json({ error: 'El turno ya está ocupado' });
        }

        // Insertar el nuevo turno
        const { data, error } = await supabase
            .from('appointments')
            .insert([{ clientName, date, time }])
            .select();

        if (error) {
            // Error de constraint único (PGRST116 / 23505) en caso de colisión
            if (error.code === '23505') {
                return res.status(409).json({ error: 'El turno ya está ocupado' });
            }
            throw error;
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ error: 'Error al guardar el turno' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
