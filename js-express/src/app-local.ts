const local = require('./app');
const port = 3000;
local.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});