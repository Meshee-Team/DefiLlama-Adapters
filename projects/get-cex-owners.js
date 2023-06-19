
// read all child folders in this directory
const fs = require('fs')
const childFolders = fs
    .readdirSync(__dirname)
    .filter(folder => !folder.endsWith('.js'))
    .filter(folder => !folder.endsWith('.json'));

// print stats
console.log(`${childFolders.length} projects found in ${__dirname}`)
const insertSql = 'INSERT INTO `cex_address` (`address`, `chain`, `cex`, `address_type`) VALUES ';
const rowSqlTpl = (addr, chain, cex) => {
    let _chain = chain.toLowerCase();
    if (chain === 'ethereum') {
        _chain = 'eth'
    }
    if (chain === 'arbitrum') {
        _chain = 'arb'
    }
    if (chain === 'optimism') {
        _chain = 'op'
    }
    if (chain === 'fantom') {
        _chain = 'ftm'
    }
    return `('${addr}', '${_chain}', '${cex}', 'from_defillama')`
}
const results = {}
const sqlRows = []
for(const childFolder of childFolders) {
    // try {
    //     fs.statSync(`./${childFolder}/index.js`, 'utf8')
    // } catch (e) {
    //     console.error('index.js not found in', childFolder)
    //     continue;
    // }
    let prjObj;
    try {
        prjObj = require(`./${childFolder}`)
    } catch (error) {
        console.error('failed to require', childFolder, error.code)
        continue;
    }
    if (!prjObj.cexOptions) {
        continue;
    }
    const { cexOptions } = prjObj
    const cexName = childFolder;
    const chains = Object.keys(cexOptions)
    results[cexName] = chains.map(chain => {
        const { owners } = cexOptions[chain]
        return {
            chain,
            owners: owners.map(owner => owner.toLowerCase())
        }
    });
    const rows = chains.map(chain => {
        const { owners } = cexOptions[chain]
        return owners.map(owner => rowSqlTpl(owner.toLowerCase(), chain, cexName))
    }).flat()
    sqlRows.push(...rows)
}

fs.writeFileSync(process.cwd() + '/cex-owners.json', JSON.stringify(results, null, 2))
fs.writeFileSync(process.cwd() + '/cex-owners.sql', insertSql + sqlRows.join(',\n') + ';')