const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.resolve(__dirname, '../../../config/settings.json');

const getSettings = (req, res) => {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) {
            return res.status(200).json({ success: true, settings: { registrationLocked: false } });
        }
        const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
        const settings = JSON.parse(data);
        res.status(200).json({ success: true, settings });
    } catch (err) {
        console.error('❌ [SETTINGS:ERR] Ao ler configurações:', err);
        res.status(500).json({ success: false, message: 'Erro ao carregar configurações.' });
    }
};

const updateSettings = (req, res) => {
    try {
        const { registrationLocked } = req.body;
        
        let settings = {};
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
            settings = JSON.parse(data);
        }

        settings.registrationLocked = registrationLocked;
        settings.lastUpdated = new Date().toISOString();

        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 4));
        
        console.log(`🛡️ [ADMIN:LOCKDOWN] Status de registro alterado para: ${registrationLocked}`);
        res.status(200).json({ success: true, message: 'Configurações atualizadas com sucesso.', settings });
    } catch (err) {
        console.error('❌ [SETTINGS:ERR] Ao salvar configurações:', err);
        res.status(500).json({ success: false, message: 'Erro ao salvar configurações.' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
