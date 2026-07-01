const url = 'https://stock.adobe.com/kr/Ajax/Search?filters%5Bcontent_type%3Aimage%5D=1&limit=30&k=apple&get_facets=0';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://stock.adobe.com/kr/search?k=apple',
  'X-Requested-With': 'XMLHttpRequest',
};

async function main() {
  console.log('url:', url);
  console.log('headers:', headers);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
    });

    const body = await response.text();

    console.log('status:', response.status);
    console.log('statusText:', response.statusText);
    console.log('body500:', body.slice(0, 500));
  } catch (error) {
    console.log('status:', 'FETCH_ERROR');
    console.log('statusText:', error?.name || 'Error');
    console.log('body500:', String(error?.message || error).slice(0, 500));
    process.exitCode = 1;
  }
}

main();
