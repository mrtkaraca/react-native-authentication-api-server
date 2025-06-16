export const errorPage = (req,res)=>{
    res.writeHead(404, {
        'Content-Type': 'text/html'
    });
    res.write("404 - Page not found");
    res.end();
} 